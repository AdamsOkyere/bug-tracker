import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/feedback-schema";

const validFeedback = {
  name: "Avery",
  email: "avery@example.com",
  type: "BUG",
  title: "The menu does not open",
  message: "The menu button does not open when I select it.",
  severity: "MEDIUM",
  pageUrl: "/settings",
  website: "",
};

describe("feedbackSchema", () => {
  it("accepts valid feedback and trims optional blank fields", () => {
    const result = feedbackSchema.safeParse({
      ...validFeedback,
      name: "  ",
      email: "  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeUndefined();
      expect(result.data.email).toBeUndefined();
    }
  });

  it("requires severity only for bug reports", () => {
    const { severity: _severity, ...withoutSeverity } = validFeedback;
    expect(feedbackSchema.safeParse(withoutSeverity).success).toBe(false);
    expect(
      feedbackSchema.safeParse({
        ...validFeedback,
        type: "FEATURE",
        severity: undefined,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid email, page URLs, and a filled honeypot", () => {
    expect(
      feedbackSchema.safeParse({ ...validFeedback, email: "not-an-email" })
        .success,
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({
        ...validFeedback,
        pageUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({ ...validFeedback, website: "spam" }).success,
    ).toBe(false);
  });
});
