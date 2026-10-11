import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import {
  buildFeedbackWhere,
  parseFeedbackFilters,
} from "@/lib/admin-feedback-query";
import { prisma } from "@/lib/prisma";

function csvCell(value: string | null): string {
  if (value === null) return "";
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Admin login required." } },
      { status: 401 },
    );
  }

  const params = new URL(request.url).searchParams;
  params.set("page", "1");
  params.set("limit", "100");
  const parsed = parseFeedbackFilters(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid filters." } },
      { status: 400 },
    );
  }

  const filters = parsed.data;
  try {
    const rows = [];
    for (let skip = 0; ; skip += 500) {
      const batch = await prisma.feedback.findMany({
        where: buildFeedbackWhere(filters),
        orderBy: { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
        skip,
        take: 500,
      });
      rows.push(...batch);
      if (batch.length < 500) break;
    }

    const header = [
      "Reference",
      "Type",
      "Title",
      "Severity",
      "Status",
      "Name",
      "Email",
      "Message",
      "Page URL",
      "Created At",
      "Admin Notes",
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.reference,
          row.type,
          row.title,
          row.severity,
          row.status,
          row.name,
          row.email,
          row.message,
          row.pageUrl,
          row.createdAt.toISOString(),
          row.adminNotes,
        ]
          .map(csvCell)
          .join(","),
      );
    }

    return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Feedback export query failed", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "We could not export submissions.",
        },
      },
      { status: 500 },
    );
  }
}
