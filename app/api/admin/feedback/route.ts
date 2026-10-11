import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import {
  buildFeedbackWhere,
  parseFeedbackFilters,
} from "@/lib/admin-feedback-query";
import { prisma } from "@/lib/prisma";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: Request) {
  if (!(await getAdminSession()))
    return errorResponse(401, "UNAUTHORIZED", "Admin login required.");

  const parsed = parseFeedbackFilters(new URL(request.url).searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid filters.",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const filters = parsed.data;
  const where = buildFeedbackWhere(filters);
  try {
    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          reference: true,
          type: true,
          title: true,
          severity: true,
          status: true,
          createdAt: true,
          name: true,
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        pageCount: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    console.error("Feedback list query failed", error);
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "We could not load submissions.",
    );
  }
}
