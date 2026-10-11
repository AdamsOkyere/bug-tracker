"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import { FeedbackStatus } from "@prisma/client";
import { toast } from "sonner";
import { statusLabel } from "@/components/admin/badges";

type FeedbackRecord = {
  id: string;
  status: FeedbackStatus;
  adminNotes: string | null;
};

export function FeedbackManagement({ feedback }: { feedback: FeedbackRecord }) {
  const router = useRouter();
  const [status, setStatus] = useState(feedback.status);
  const [notes, setNotes] = useState(feedback.adminNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const body = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(body.error?.message ?? "Update failed.");
      toast.success("Submission updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteFeedback() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: { message: string } };
      if (!response.ok)
        throw new Error(body.error?.message ?? "Delete failed.");
      toast.success("Submission deleted");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <form
        className="rounded-md border border-ink/10 bg-white p-5"
        onSubmit={save}
      >
        <h2 className="font-display text-xl">Team actions</h2>
        <label className="mt-5 block text-xs font-bold" htmlFor="status">
          Status
        </label>
        <select
          className="mt-2 h-11 w-full rounded border-ink/15 bg-white text-sm focus:border-moss focus:ring-moss"
          id="status"
          onChange={(event) => setStatus(event.target.value as FeedbackStatus)}
          value={status}
        >
          {Object.values(FeedbackStatus).map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </select>
        <label className="mt-5 block text-xs font-bold" htmlFor="adminNotes">
          Internal note
        </label>
        <textarea
          className="mt-2 min-h-36 w-full resize-y rounded border-ink/15 bg-white text-sm focus:border-moss focus:ring-moss"
          id="adminNotes"
          maxLength={10000}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add context for the team..."
          value={notes}
        />
        <p className="mt-1 text-right text-[10px] text-ink/40">
          {notes.length}/10,000
        </p>
        <button
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded bg-ink px-4 text-xs font-bold text-white hover:bg-moss disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? (
            <LoaderCircle
              aria-label="Saving"
              className="animate-spin"
              size={15}
            />
          ) : (
            <>
              <Save aria-hidden="true" size={15} /> Save changes
            </>
          )}
        </button>
        <button
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-[#d9a69a] text-xs font-bold text-[#a33c30] hover:bg-[#fff4f0]"
          onClick={() => setConfirmDelete(true)}
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} /> Delete submission
        </button>
      </form>

      <a
        className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-ink/55 hover:text-ink"
        href="/admin"
      >
        <ArrowLeft aria-hidden="true" size={14} /> Back to inbox
      </a>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-5"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <section
            aria-labelledby="delete-title"
            aria-modal="true"
            className="w-full max-w-sm rounded-md bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-[#fae8df] text-[#a33c30]">
              <AlertTriangle aria-hidden="true" size={19} />
            </div>
            <h2 className="mt-4 font-display text-2xl" id="delete-title">
              Delete this note?
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              This permanently removes the submission and its internal notes.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="h-10 rounded border border-ink/20 px-4 text-xs font-bold"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded bg-[#a33c30] px-4 text-xs font-bold text-white disabled:opacity-60"
                disabled={deleting}
                onClick={deleteFeedback}
                type="button"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
