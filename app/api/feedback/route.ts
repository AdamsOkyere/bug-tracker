import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { feedbackSchema } from "@/lib/feedback-schema";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/reference";
import { rateLimitKey, allowSubmission } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";

function getClientIp(request: Request): string {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export async function POST(request: Request) {
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

  const result = feedbackSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Please correct the highlighted fields.",
      result.error.flatten().fieldErrors,
    );
  }

  if (result.data.website) {
    return errorResponse(
      400,
      "SPAM_DETECTED",
      "Unable to accept this submission.",
    );
  }

  try {
    const allowed = await allowSubmission(rateLimitKey(getClientIp(request)));
    if (!allowed) {
      return errorResponse(
        429,
        "RATE_LIMITED",
        "Too many submissions. Please try again in a few minutes.",
      );
    }

    const data = result.data;
    const feedback = await prisma.feedback.create({
      data: {
        reference: generateReference(),
        name: data.name ? sanitizeText(data.name) : null,
        email: data.email?.toLowerCase() ?? null,
        type: data.type,
        title: sanitizeText(data.title),
        message: sanitizeText(data.message),
        severity: data.type === "BUG" ? data.severity : null,
        pageUrl: data.pageUrl ? sanitizeText(data.pageUrl) : null,
      },
      select: { reference: true },
    });

    return NextResponse.json(
      {
        data: {
          reference: feedback.reference,
          message: "Thank you. Your feedback is in good hands.",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        503,
        "REFERENCE_CONFLICT",
        "Please try submitting again.",
      );
    }
    console.error("Feedback submission failed", error);
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "We could not save your feedback. Please try again.",
    );
  }
}
