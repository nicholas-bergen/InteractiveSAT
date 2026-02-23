"use client";

import { useEffect, useState } from "react";

import LessonCard from "@/components/LessonCard";
import ReviewCard from "@/components/ReviewCard";
import { lessons } from "@/content/lessons";
import { buildReviewItems } from "@/lib/review";
import { buildLessonProgress, loadAttempts } from "@/lib/storage";
import { LessonProgress } from "@/lib/types";

export default function HomePage() {
  const [progressByLesson, setProgressByLesson] = useState<Record<string, LessonProgress>>({});
  const [missedReviewCount, setMissedReviewCount] = useState(0);

  useEffect(() => {
    // Homepage is a client component so it can read localStorage progress.
    const attempts = loadAttempts();
    setProgressByLesson(buildLessonProgress(lessons, attempts));
    setMissedReviewCount(buildReviewItems(lessons, attempts).length);
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Lesson Lab</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Choose a lesson</h1>
        <p className="max-w-2xl text-sm text-slate-700">
          Cards are your menu. Each lesson still has its own page URL for a clean runner experience.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} progress={progressByLesson[lesson.id]} />
        ))}
        <ReviewCard missedCount={missedReviewCount} />
      </section>
    </main>
  );
}
