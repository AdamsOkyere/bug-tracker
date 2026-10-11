import { FeedbackStatus, FeedbackType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Admin login required." } },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const weekStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);
    const chartStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 13),
    );

    const [total, newCount, resolvedThisWeek, typeCounts, recent] =
      await Promise.all([
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
        prisma.feedback.count({
          where: {
            status: FeedbackStatus.RESOLVED,
            updatedAt: { gte: weekStart },
          },
        }),
        prisma.feedback.groupBy({ by: ["type"], _count: { _all: true } }),
        prisma.feedback.findMany({
          where: { createdAt: { gte: chartStart } },
          select: { createdAt: true },
        }),
      ]);

    const byType = Object.fromEntries(
      Object.values(FeedbackType).map((type) => [
        type,
        typeCounts.find((entry) => entry.type === type)?._count._all ?? 0,
      ]),
    );
    const byDay = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(chartStart);
      day.setUTCDate(chartStart.getUTCDate() + index);
      const key = day.toISOString().slice(0, 10);
      return {
        date: key,
        label: day.toLocaleDateString("en", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        count: recent.filter(
          (entry) => entry.createdAt.toISOString().slice(0, 10) === key,
        ).length,
      };
    });

    return NextResponse.json({
      data: { total, new: newCount, resolvedThisWeek, byType, byDay },
    });
  } catch (error) {
    console.error("Feedback stats query failed", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "We could not load dashboard statistics.",
        },
      },
      { status: 500 },
    );
  }
}
