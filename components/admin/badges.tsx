import type { FeedbackStatus, FeedbackType } from "@prisma/client";

export function typeLabel(value: FeedbackType): string {
  return {
    BUG: "Bug report",
    FEATURE: "Feature request",
    GENERAL: "General feedback",
  }[value];
}

export function statusLabel(value: FeedbackStatus): string {
  return {
    NEW: "New",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  }[value];
}
