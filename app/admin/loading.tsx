export default function AdminLoading() {
  return (
    <main
      aria-label="Loading submissions"
      className="min-h-screen bg-[#f7f7f2] px-4 py-8 sm:px-8"
    >
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-9 w-full border-b border-ink/10" />
        <div className="mt-12 h-9 w-64 rounded bg-ink/10" />
        <div className="mt-8 h-20 rounded bg-white" />
        <div className="mt-5 space-y-2 rounded border border-ink/10 bg-white p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="h-12 rounded bg-[#f1f1ec]" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
