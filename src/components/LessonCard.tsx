import TransitionLink from "@/components/TransitionLink";

import { Lesson, LessonProgress } from "@/lib/types";

interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress;
}

export default function LessonCard({ lesson, progress }: LessonCardProps) {
  const attemptedItems = progress?.attemptedItems ?? 0;
  const totalItems = progress?.totalItems ?? lesson.items.length;
  const completionPercent = totalItems === 0 ? 0 : Math.round((attemptedItems / totalItems) * 100);

  const isComplete = totalItems > 0 && attemptedItems >= totalItems;
  const isInProgress = attemptedItems > 0 && !isComplete;

  const status = isComplete ? "Complete" : isInProgress ? "In progress" : "Ready";
  const statusClasses = isComplete
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isInProgress
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : "border-slate-200 bg-slate-100 text-slate-600";

  const progressBarClass = isComplete ? "bg-emerald-500" : isInProgress ? "bg-sky-500" : "bg-slate-400";
  const ctaText = isInProgress ? "Resume lesson" : "Start lesson";

  return (
    <TransitionLink
      href={`/lesson/${lesson.id}`}
      transitionMode="to-lesson"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/88 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_20px_44px_rgba(14,116,144,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/80 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Lesson</p>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses}`}>
          {status}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-semibold leading-tight text-slate-900">{lesson.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{lesson.description}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {attemptedItems}/{totalItems} activities
          </span>
          <span>{completionPercent}%</span>
        </div>

        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full transition-[width] duration-300 ease-out ${progressBarClass}`} style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{lesson.items.length} prompts</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">~{lesson.estimatedMinutes} min</span>
      </div>

      <p className="mt-auto pt-5 text-sm font-semibold text-slate-800 transition-colors duration-150 group-hover:text-brand-700">
        {ctaText} →
      </p>
    </TransitionLink>
  );
}
