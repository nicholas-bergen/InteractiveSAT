import Link from "next/link";

import { Lesson, LessonProgress } from "@/lib/types";

interface LessonCardProps {
  lesson: Lesson;
  progress?: LessonProgress;
}

export default function LessonCard({ lesson, progress }: LessonCardProps) {
  const attemptedItems = progress?.attemptedItems ?? 0;
  const totalItems = progress?.totalItems ?? lesson.items.length;
  const completionPercent = totalItems === 0 ? 0 : Math.round((attemptedItems / totalItems) * 100);

  return (
    <Link
      href={`/lesson/${lesson.id}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Lesson</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{lesson.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{lesson.description}</p>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <p>
          Progress: {attemptedItems}/{totalItems} attempted
        </p>
        <p>{completionPercent}% complete</p>
        <p>Est. time: {lesson.estimatedMinutes} min</p>
      </div>

      <p className="mt-auto pt-4 text-sm font-medium text-brand-700 group-hover:text-brand-600">Open lesson</p>
    </Link>
  );
}
