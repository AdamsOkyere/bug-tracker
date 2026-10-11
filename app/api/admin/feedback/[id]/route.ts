import { FeedbackStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitize";

const updateSchema = z
  .object({
    status: z.nativeEnum(FeedbackStatus).optional(),
    adminNotes: z
      .string()
      .trim()
      .max(10000, "Notes must be 10,000 characters or fewer.")
      .optional(),
  })
  .refine(
    (value) => value.status !== undefined || value.adminNotes !== undefined,
    {
      message: "Provide a status or admin note to update.",
    },
  );

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await getAdminSession()))
    return errorResponse(401, "UNAUTHORIZED", "Admin login required.");
  const feedback = await prisma.feedback.findUnique({
    where: { id: params.id },
  });
  if (!feedback)
    return errorResponse(404, "NOT_FOUND", "Submission not found.");
  return NextResponse.json({ data: feedback });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await getAdminSession()))
    return errorResponse(401, "UNAUTHORIZED", "Admin login required.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid update.",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.feedback.update({
      where: { id: params.id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.adminNotes !== undefined
          ? { adminNotes: sanitizeText(parsed.data.adminNotes) }
          : {}),
      },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return errorResponse(404, "NOT_FOUND", "Submission not found.");
    }
    console.error("Feedback update failed", error);
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "We could not update this submission.",
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await getAdminSession()))
    return errorResponse(401, "UNAUTHORIZED", "Admin login required.");
  try {
    await prisma.feedback.delete({ where: { id: params.id } });
    return NextResponse.json({ data: { id: params.id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return errorResponse(404, "NOT_FOUND", "Submission not found.");
    }
    console.error("Feedback deletion failed", error);
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "We could not delete this submission.",
    );
  }
}
