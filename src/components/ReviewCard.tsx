import Link from "next/link";

interface ReviewCardProps {
  missedCount: number;
}

export default function ReviewCard({ missedCount }: ReviewCardProps) {
  return (
    <Link
      href="/review"
      className="group flex h-full flex-col rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Review</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">Practice Missed Items</h2>
      <p className="mt-2 text-sm text-slate-700">Keep this focused list small and revisit it often.</p>

      <p className="mt-4 text-sm text-slate-700">
        {missedCount === 0 ? "No missed items right now." : `${missedCount} missed item(s) ready for review`}
      </p>

      <p className="mt-auto pt-4 text-sm font-medium text-amber-700 group-hover:text-amber-600">Open review</p>
    </Link>
  );
}
