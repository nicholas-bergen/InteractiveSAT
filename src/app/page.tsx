"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import LessonCard from "@/components/LessonCard";
import ReviewCard from "@/components/ReviewCard";
import TransitionLink from "@/components/TransitionLink";
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

  const summary = useMemo(() => {
    const totalLessons = lessons.length;
    const totalEstimatedMinutes = lessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0);

    const startedLessons = lessons.filter((lesson) => {
      const attempted = progressByLesson[lesson.id]?.attemptedItems ?? 0;
      return attempted > 0;
    }).length;

    const completedLessons = lessons.filter((lesson) => {
      const attempted = progressByLesson[lesson.id]?.attemptedItems ?? 0;
      const totalItems = progressByLesson[lesson.id]?.totalItems ?? lesson.items.length;
      return totalItems > 0 && attempted >= totalItems;
    }).length;

    const attemptedItems = lessons.reduce((total, lesson) => {
      return total + (progressByLesson[lesson.id]?.attemptedItems ?? 0);
    }, 0);

    const totalItems = lessons.reduce((total, lesson) => {
      return total + (progressByLesson[lesson.id]?.totalItems ?? lesson.items.length);
    }, 0);

    const overallProgressPercent = totalItems === 0 ? 0 : Math.round((attemptedItems / totalItems) * 100);

    const nextLesson =
      lessons.find((lesson) => {
        const attempted = progressByLesson[lesson.id]?.attemptedItems ?? 0;
        const lessonTotal = progressByLesson[lesson.id]?.totalItems ?? lesson.items.length;
        return attempted > 0 && attempted < lessonTotal;
      }) ??
      lessons.find((lesson) => {
        const attempted = progressByLesson[lesson.id]?.attemptedItems ?? 0;
        return attempted === 0;
      }) ??
      lessons[0];

    return {
      totalLessons,
      totalEstimatedMinutes,
      startedLessons,
      completedLessons,
      attemptedItems,
      totalItems,
      overallProgressPercent,
      nextLesson
    };
  }, [progressByLesson]);

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
        <div className="absolute -left-20 top-5 h-52 w-52 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-white/85 bg-white/82 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-sm md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-200 via-brand-400/60 to-emerald-300" />

        <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Lesson Lab</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Seamless learning, from launch to lesson.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
              Pick up where you left off with the same clean, immersive feel used inside each lesson.
            </p>

            <div className="mt-5 max-w-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>Overall progress</span>
                <span>{summary.overallProgressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${summary.overallProgressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {summary.attemptedItems}/{summary.totalItems} lesson activities attempted.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {summary.nextLesson ? (
                <TransitionLink
                  href={`/lesson/${summary.nextLesson.id}`}
                  transitionMode="to-lesson"
                  className="inline-flex h-11 items-center rounded-full border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] transition-all duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  Continue learning
                </TransitionLink>
              ) : null}

              <Link
                href="/review"
                className="inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
              >
                Open review
              </Link>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Lessons</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalLessons}</dd>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Started</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.startedLessons}</dd>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Completed</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">{summary.completedLessons}</dd>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Study Time</dt>
              <dd className="mt-1 text-2xl font-semibold text-slate-900">~{summary.totalEstimatedMinutes} min</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Choose your next activity</h2>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tap any card to launch</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} progress={progressByLesson[lesson.id]} />
          ))}
          <ReviewCard missedCount={missedReviewCount} />
        </div>
      </section>
    </main>
  );
}
