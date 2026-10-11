import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max).optional(),
  );

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().email("Enter a valid email address.").max(254).optional(),
);

const optionalPageUrl = optionalText(2048).refine(
  (value) =>
    !value ||
    value.startsWith("/") ||
    (() => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    })(),
  "Enter a valid URL or page path.",
);

export const feedbackSchema = z
  .object({
    name: optionalText(80),
    email: optionalEmail,
    type: z.enum(["BUG", "FEATURE", "GENERAL"], {
      errorMap: () => ({ message: "Choose a feedback type." }),
    }),
    title: z
      .string()
      .trim()
      .min(3, "Add a title of at least 3 characters.")
      .max(120),
    message: z
      .string()
      .trim()
      .min(10, "Add a message of at least 10 characters.")
      .max(5000),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    pageUrl: optionalPageUrl,
    website: z.string().max(0).optional(),
  })
  .superRefine((value, context) => {
    if (value.type === "BUG" && !value.severity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["severity"],
        message: "Choose a severity for your bug report.",
      });
    }
    if (value.type !== "BUG" && value.severity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["severity"],
        message: "Severity is only available for bug reports.",
      });
    }
  });

export type FeedbackInput = z.infer<typeof feedbackSchema>;
