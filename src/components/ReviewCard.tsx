import Link from "next/link";

interface ReviewCardProps {
  missedCount: number;
}

export default function ReviewCard({ missedCount }: ReviewCardProps) {
  const hasMissedItems = missedCount > 0;

  return (
    <Link
      href="/review"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-amber-50 to-orange-50/85 p-5 shadow-[0_12px_30px_rgba(124,45,18,0.12)] transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-[0_20px_42px_rgba(124,45,18,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Review</p>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            hasMissedItems ? "border-amber-300 bg-amber-100 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {hasMissedItems ? "Needs attention" : "All clear"}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-semibold leading-tight text-slate-900">Practice missed items</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        Keep mistakes fresh and close the loop with short targeted review sessions.
      </p>

      <div className="mt-4 rounded-2xl border border-amber-200/80 bg-white/60 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Queued right now</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{missedCount}</p>
      </div>

      <p className="mt-auto pt-5 text-sm font-semibold text-amber-800 transition-colors duration-150 group-hover:text-amber-700">
        {hasMissedItems ? "Open review" : "Keep momentum"} →
      </p>
    </Link>
  );
}
