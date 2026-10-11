import { FeedbackStatus, FeedbackType, Severity } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import {
  buildFeedbackWhere,
  filterQueryString,
  parseFeedbackFilters,
} from "@/lib/admin-feedback-query";
import { prisma } from "@/lib/prisma";
import { AdminSignOut } from "@/components/admin/sign-out";
import { StatsPanel } from "@/components/admin/stats-panel";
import { statusLabel, typeLabel } from "@/components/admin/badges";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  if (!(await getAdminSession())) redirect("/admin/login");

  const params = new URLSearchParams();
  for (const key of [
    "q",
    "type",
    "status",
    "severity",
    "sort",
    "page",
    "limit",
  ]) {
    const value = searchParams[key];
    if (typeof value === "string") params.set(key, value);
  }
  const parsed = parseFeedbackFilters(params);
  if (!parsed.success) redirect("/admin");
  const filters = parsed.data;
  const where = buildFeedbackWhere(filters);
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: filters.sort === "oldest" ? "asc" : "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.feedback.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / filters.limit));
  const query = filterQueryString(filters);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 pb-5">
          <a className="flex items-center gap-2.5" href="/">
            <span className="flex size-8 items-center justify-center rounded-sm bg-ink font-display text-sm text-paper">
              F
            </span>
            <span className="font-display text-lg">
              Fieldnote{" "}
              <span className="font-sans text-xs text-ink/45">/ Inbox</span>
            </span>
          </a>
          <div className="flex items-center gap-4">
            <a
              className="text-xs font-semibold text-moss hover:underline"
              href={`/api/admin/export${query ? `?${query}` : ""}`}
            >
              Export CSV
            </a>
            <AdminSignOut />
          </div>
        </header>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-moss">
                Feedback desk
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl">
                All submissions
              </h1>
            </div>
            <p className="text-sm text-ink/55">
              {total} {total === 1 ? "note" : "notes"}
            </p>
          </div>

          <StatsPanel />

          <form
            action="/admin"
            className="mt-7 grid gap-3 rounded-md border border-ink/10 bg-white p-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(120px,155px))_auto] lg:items-end"
          >
            <label className="text-xs font-semibold text-ink/65">
              Search
              <input
                className="mt-1.5 h-10 w-full rounded border-ink/15 bg-[#fbfbf8] text-sm placeholder:text-ink/35 focus:border-moss focus:ring-moss"
                defaultValue={filters.q}
                name="q"
                placeholder="Title, message, reference..."
              />
            </label>
            <FilterSelect
              label="Type"
              name="type"
              value={filters.type ?? ""}
              options={Object.values(FeedbackType).map((value) => [
                value,
                typeLabel(value),
              ])}
            />
            <FilterSelect
              label="Status"
              name="status"
              value={filters.status ?? ""}
              options={Object.values(FeedbackStatus).map((value) => [
                value,
                statusLabel(value),
              ])}
            />
            <FilterSelect
              label="Severity"
              name="severity"
              value={filters.severity ?? ""}
              options={Object.values(Severity).map((value) => [
                value,
                value.charAt(0) + value.slice(1).toLowerCase(),
              ])}
            />
            <FilterSelect
              label="Date"
              name="sort"
              value={filters.sort}
              options={[
                ["newest", "Newest first"],
                ["oldest", "Oldest first"],
              ]}
            />
            <button
              className="h-10 rounded bg-ink px-4 text-xs font-bold text-white hover:bg-moss"
              type="submit"
            >
              Apply
            </button>
          </form>

          <section
            aria-label="Feedback submissions"
            className="mt-5 overflow-hidden rounded-md border border-ink/10 bg-white"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-[#f4f5ef] text-[10px] uppercase tracking-[0.1em] text-ink/50">
                  <tr>
                    <th className="px-4 py-3 font-bold">Reference</th>
                    <th className="px-4 py-3 font-bold">Submission</th>
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold">Severity</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {items.map((item) => (
                    <tr className="transition hover:bg-[#fafaf7]" key={item.id}>
                      <td className="whitespace-nowrap px-4 py-4">
                        <a
                          className="font-mono text-xs font-bold text-moss hover:underline"
                          href={`/admin/feedback/${item.id}`}
                        >
                          {item.reference}
                        </a>
                      </td>
                      <td className="max-w-[310px] px-4 py-4">
                        <a
                          className="block truncate text-sm font-semibold hover:text-moss"
                          href={`/admin/feedback/${item.id}`}
                        >
                          {item.title}
                        </a>
                        <span className="mt-1 block text-xs text-ink/45">
                          {item.name || "Anonymous"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <TypeBadge value={item.type} />
                      </td>
                      <td className="px-4 py-4">
                        {item.severity ? (
                          <SeverityBadge value={item.severity} />
                        ) : (
                          <span className="text-xs text-ink/35">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={item.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs text-ink/55">
                        {item.createdAt.toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {items.length === 0 && (
              <div className="px-5 py-16 text-center">
                <p className="font-display text-xl">Nothing here yet.</p>
                <p className="mt-2 text-sm text-ink/55">
                  Try widening your filters or check back after the next
                  submission.
                </p>
              </div>
            )}
            {items.length > 0 && (
              <nav
                aria-label="Pagination"
                className="flex items-center justify-between border-t border-ink/10 px-4 py-3"
              >
                <p className="text-xs text-ink/55">
                  Page {filters.page} of {pages}{" "}
                  <span className="hidden sm:inline">· {total} total</span>
                </p>
                <div className="flex gap-2">
                  {filters.page > 1 && (
                    <a
                      className="rounded border border-ink/15 px-3 py-2 text-xs font-semibold hover:bg-paper"
                      href={`/admin?${filterQueryString(filters, filters.page - 1)}`}
                    >
                      Previous
                    </a>
                  )}
                  {filters.page < pages && (
                    <a
                      className="rounded border border-ink/15 px-3 py-2 text-xs font-semibold hover:bg-paper"
                      href={`/admin?${filterQueryString(filters, filters.page + 1)}`}
                    >
                      Next
                    </a>
                  )}
                </div>
              </nav>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="text-xs font-semibold text-ink/65">
      {label}
      <select
        className="mt-1.5 h-10 w-full rounded border-ink/15 bg-[#fbfbf8] text-sm focus:border-moss focus:ring-moss"
        defaultValue={value}
        name={name}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function TypeBadge({ value }: { value: FeedbackType }) {
  const colors = {
    BUG: "bg-[#fae8df] text-[#99452e]",
    FEATURE: "bg-[#e7eddf] text-[#46634b]",
    GENERAL: "bg-[#e5edf0] text-[#416371]",
  };
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-[10px] font-bold ${colors[value]}`}
    >
      {typeLabel(value)}
    </span>
  );
}

function SeverityBadge({ value }: { value: Severity }) {
  const colors = {
    LOW: "text-[#526b57]",
    MEDIUM: "text-[#a26827]",
    HIGH: "text-[#b14535]",
  };
  return (
    <span className={`text-xs font-semibold ${colors[value]}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </span>
  );
}

function StatusBadge({ value }: { value: FeedbackStatus }) {
  const colors = {
    NEW: "bg-[#e5edf0] text-[#416371]",
    IN_PROGRESS: "bg-[#f8edd9] text-[#916020]",
    RESOLVED: "bg-[#e5eee4] text-[#426648]",
    CLOSED: "bg-[#ecece8] text-[#6d7069]",
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold ${colors[value]}`}
    >
      {statusLabel(value)}
    </span>
  );
}
