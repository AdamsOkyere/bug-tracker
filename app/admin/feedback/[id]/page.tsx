import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { FeedbackManagement } from "@/components/admin/feedback-management";
import { statusLabel, typeLabel } from "@/components/admin/badges";

export default async function FeedbackDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const feedback = await prisma.feedback.findUnique({
    where: { id: params.id },
  });
  if (!feedback) notFound();

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-ink/15 pb-5">
          <a className="flex items-center gap-2.5" href="/admin">
            <span className="flex size-8 items-center justify-center rounded-sm bg-ink font-display text-sm text-paper">
              F
            </span>
            <span className="font-display text-lg">
              Fieldnote{" "}
              <span className="font-sans text-xs text-ink/45">/ Inbox</span>
            </span>
          </a>
          <a
            className="text-xs font-semibold text-moss hover:underline"
            href="/admin"
          >
            All submissions
          </a>
        </header>
        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0 rounded-md border border-ink/10 bg-white p-5 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-moss">
                {feedback.reference}
              </span>
              <span className="rounded bg-[#eef0e9] px-2 py-1 text-[10px] font-bold text-ink/65">
                {typeLabel(feedback.type)}
              </span>
              <span className="rounded bg-[#e5edf0] px-2 py-1 text-[10px] font-bold text-[#416371]">
                {statusLabel(feedback.status)}
              </span>
              {feedback.severity && (
                <span className="rounded bg-[#fae8df] px-2 py-1 text-[10px] font-bold text-[#99452e]">
                  {feedback.severity} severity
                </span>
              )}
            </div>
            <h1 className="mt-5 break-words font-display text-3xl leading-tight sm:text-4xl">
              {feedback.title}
            </h1>
            <p className="mt-3 text-xs text-ink/50">
              Received{" "}
              {feedback.createdAt.toLocaleString("en", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            <div className="my-7 border-t border-ink/10" />
            <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
              Message
            </h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-ink/80">
              {feedback.message}
            </p>
            {feedback.pageUrl && (
              <div className="mt-7 border-t border-ink/10 pt-5">
                <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
                  Page or URL
                </h2>
                <p className="mt-2 break-all text-sm text-moss">
                  {feedback.pageUrl}
                </p>
              </div>
            )}
            <div className="mt-7 border-t border-ink/10 pt-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">
                Submitted by
              </h2>
              <p className="mt-2 text-sm">{feedback.name || "Anonymous"}</p>
              {feedback.email ? (
                <a
                  className="mt-1 inline-block text-sm text-moss underline underline-offset-2"
                  href={`mailto:${feedback.email}`}
                >
                  {feedback.email}
                </a>
              ) : (
                <p className="mt-1 text-xs text-ink/45">No email provided</p>
              )}
            </div>
          </article>
          <FeedbackManagement
            feedback={{
              id: feedback.id,
              status: feedback.status,
              adminNotes: feedback.adminNotes,
            }}
          />
        </div>
      </div>
    </main>
  );
}
