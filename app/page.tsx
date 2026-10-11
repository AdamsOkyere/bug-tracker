"use client";

import {
  cloneElement,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Bug,
  Check,
  Lightbulb,
  MessageSquareText,
} from "lucide-react";
import { toast } from "sonner";
import { feedbackSchema, type FeedbackInput } from "@/lib/feedback-schema";

type FieldErrors = Partial<Record<keyof FeedbackInput, string>>;
type SubmissionResult = { reference: string; message: string };

const feedbackTypes = [
  {
    value: "BUG",
    label: "Bug report",
    icon: Bug,
    detail: "Something is not working",
  },
  {
    value: "FEATURE",
    label: "Feature idea",
    icon: Lightbulb,
    detail: "A way to make this better",
  },
  {
    value: "GENERAL",
    label: "General note",
    icon: MessageSquareText,
    detail: "Anything else on your mind",
  },
] as const;

const fieldClass =
  "w-full rounded-md border border-[#c9c9bd] bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-[#92958c] transition focus:border-moss focus:bg-white focus:outline-none focus:ring-2 focus:ring-moss/20";

export default function HomePage() {
  const [type, setType] = useState<FeedbackInput["type"]>("BUG");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmation, setConfirmation] = useState<SubmissionResult | null>(
    null,
  );

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const parsed = feedbackSchema.safeParse({ ...payload, type });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FeedbackInput;
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      const firstInvalid = Object.keys(nextErrors)[0];
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = (await response.json()) as {
        data?: SubmissionResult;
        error?: { message: string; details?: Record<string, string[]> };
      };

      if (!response.ok) {
        if (body.error?.details) {
          const nextErrors: FieldErrors = {};
          for (const [field, messages] of Object.entries(body.error.details)) {
            if (messages?.[0])
              nextErrors[field as keyof FeedbackInput] = messages[0];
          }
          setErrors(nextErrors);
        }
        throw new Error(
          body.error?.message ?? "Your feedback could not be sent.",
        );
      }

      if (!body.data)
        throw new Error("The server returned an unexpected response.");
      setConfirmation(body.data);
      toast.success("Feedback received");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <main className="min-h-screen bg-paper px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Header />
          <section className="mx-auto mt-16 max-w-xl border-t border-ink/15 pt-12 sm:mt-24">
            <div className="mb-7 flex size-12 items-center justify-center rounded-full bg-[#e2eadf] text-moss">
              <Check aria-hidden="true" size={23} />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
              Received with thanks
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              A better product starts here.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-ink/70">
              {confirmation.message}
            </p>
            <div className="mt-9 flex items-center justify-between border-y border-ink/15 py-4">
              <span className="text-sm text-ink/65">Your reference</span>
              <code className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-ink">
                {confirmation.reference}
              </code>
            </div>
            <button
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-moss underline decoration-moss/40 underline-offset-4 hover:decoration-moss"
              onClick={() => setConfirmation(null)}
              type="button"
            >
              Send another note <ArrowUpRight aria-hidden="true" size={15} />
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-5 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <Header />
        <div className="mt-12 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
          <section className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
              Product feedback
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Tell us what you noticed.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-ink/65">
              A rough edge, a bright idea, a small detail. Leave a note and help
              us make the next version better.
            </p>

            <form
              className="mt-9 space-y-7"
              noValidate
              onSubmit={submitFeedback}
            >
              <fieldset>
                <legend className="mb-3 text-sm font-bold">
                  What kind of note is this?
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {feedbackTypes.map(({ value, label, icon: Icon, detail }) => (
                    <label
                      className={`relative flex cursor-pointer gap-3 rounded-md border p-3 transition ${type === value ? "border-moss bg-[#e9eee5]" : "border-ink/15 bg-white/45 hover:border-ink/35"}`}
                      key={value}
                    >
                      <input
                        checked={type === value}
                        className="sr-only"
                        name="type-choice"
                        onChange={() => {
                          setType(value);
                          setErrors((current) => ({
                            ...current,
                            severity: undefined,
                          }));
                        }}
                        type="radio"
                        value={value}
                      />
                      <Icon
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-moss"
                        size={17}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold">{label}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-ink/60">
                          {detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {type === "BUG" && (
                <fieldset>
                  <legend className="mb-2 text-sm font-bold">
                    How much does it get in the way?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {(["LOW", "MEDIUM", "HIGH"] as const).map((severity) => (
                      <label className="cursor-pointer" key={severity}>
                        <input
                          className="peer sr-only"
                          name="severity"
                          type="radio"
                          value={severity}
                        />
                        <span className="inline-flex rounded border border-ink/20 px-3 py-2 text-xs font-semibold text-ink/70 transition peer-checked:border-coral peer-checked:bg-[#f8e7df] peer-checked:text-[#a84931] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-coral">
                          {severity.charAt(0) + severity.slice(1).toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.severity && (
                    <FieldError id="severity" message={errors.severity} />
                  )}
                </fieldset>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" optional error={errors.name}>
                  <input
                    className={fieldClass}
                    id="name"
                    maxLength={80}
                    name="name"
                    placeholder="How should we address you?"
                  />
                </Field>
                <Field label="Email" optional error={errors.email}>
                  <input
                    className={fieldClass}
                    id="email"
                    maxLength={254}
                    name="email"
                    placeholder="you@example.com"
                    type="email"
                  />
                </Field>
              </div>
              <Field label="A short title" error={errors.title}>
                <input
                  className={fieldClass}
                  id="title"
                  maxLength={120}
                  name="title"
                  placeholder="The page freezes after I sign in"
                />
              </Field>
              <Field label="Tell us a little more" error={errors.message}>
                <textarea
                  className={`${fieldClass} min-h-36 resize-y`}
                  id="message"
                  maxLength={5000}
                  name="message"
                  placeholder="What happened? What did you expect instead?"
                  rows={5}
                />
              </Field>
              <Field
                label="Where did it happen?"
                optional
                error={errors.pageUrl}
              >
                <input
                  className={fieldClass}
                  id="pageUrl"
                  maxLength={2048}
                  name="pageUrl"
                  placeholder="/settings or https://example.com/page"
                />
              </Field>
              <div
                aria-hidden="true"
                className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
              >
                <label htmlFor="website">Leave this field blank</label>
                <input
                  autoComplete="off"
                  id="website"
                  name="website"
                  tabIndex={-1}
                />
              </div>
              <div className="flex flex-col gap-3 border-t border-ink/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink/55">
                  Fields marked optional can be left blank.
                </p>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ink px-6 text-sm font-bold text-white transition hover:bg-moss disabled:cursor-wait disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Sending..." : "Send feedback"}
                  {!isSubmitting && (
                    <ArrowUpRight aria-hidden="true" size={16} />
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="hidden border-l border-ink/15 pl-7 pt-1 lg:block">
            <p className="font-display text-xl">Small notes add up.</p>
            <p className="mt-3 text-sm leading-6 text-ink/60">
              Specific details help us understand what happened and where to
              look.
            </p>
            <div className="mt-9 border-t border-ink/15 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink/50">
                For bug reports
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                Include what you were doing when things took an unexpected turn.
              </p>
            </div>
            <p className="mt-9 border-t border-ink/15 pt-4 text-xs leading-5 text-ink/45">
              Your note goes straight to the team. Contact details are always
              optional.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between border-b border-ink/15 pb-4">
      <a
        aria-label="Fieldnote feedback home"
        className="flex items-center gap-2.5"
        href="/"
      >
        <span className="flex size-8 items-center justify-center rounded-sm bg-ink font-display text-sm text-paper">
          F
        </span>
        <span className="font-display text-lg">Fieldnote</span>
      </a>
      <a
        className="inline-flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-ink"
        href="/admin/login"
      >
        Team login <ArrowUpRight aria-hidden="true" size={14} />
      </a>
    </header>
  );
}

function Field({
  label,
  optional = false,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const child = children as ReactElement<{
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }>;
  return (
    <div>
      <label
        className="mb-2 flex items-baseline justify-between text-sm font-bold"
        htmlFor={child.props.id}
      >
        {label}
        {optional && (
          <span className="text-[11px] font-normal text-ink/50">Optional</span>
        )}
      </label>
      {cloneElement(child, {
        "aria-describedby": error ? `${child.props.id}-error` : undefined,
        "aria-invalid": Boolean(error),
      })}
      {error && <FieldError id={child.props.id ?? "field"} message={error} />}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p
      className="mt-1.5 text-xs font-medium text-[#a33c30]"
      id={`${id}-error`}
      role="alert"
    >
      {message}
    </p>
  );
}
