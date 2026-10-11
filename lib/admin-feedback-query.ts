import { FeedbackStatus, FeedbackType, Prisma, Severity } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().max(120).default(""),
  type: z.nativeEnum(FeedbackType).optional(),
  status: z.nativeEnum(FeedbackStatus).optional(),
  severity: z.nativeEnum(Severity).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type FeedbackFilters = z.infer<typeof querySchema>;

export function parseFeedbackFilters(params: URLSearchParams) {
  return querySchema.safeParse({
    q: params.get("q") ?? "",
    type: params.get("type") || undefined,
    status: params.get("status") || undefined,
    severity: params.get("severity") || undefined,
    sort: params.get("sort") || "newest",
    page: params.get("page") || "1",
    limit: params.get("limit") || "10",
  });
}

export function buildFeedbackWhere(
  filters: FeedbackFilters,
): Prisma.FeedbackWhereInput {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.q
      ? {
          OR: [
            { reference: { contains: filters.q, mode: "insensitive" } },
            { title: { contains: filters.q, mode: "insensitive" } },
            { message: { contains: filters.q, mode: "insensitive" } },
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function filterQueryString(
  filters: Partial<FeedbackFilters>,
  page?: number,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.sort) params.set("sort", filters.sort);
  if (page && page > 1) params.set("page", String(page));
  return params.toString();
}
