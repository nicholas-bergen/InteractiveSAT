"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { lessons } from "@/content/lessons";
import { buildReviewItems } from "@/lib/review";
import { clearAttempts, loadAttempts } from "@/lib/storage";
import { ReviewItem } from "@/lib/types";

function formatPart(part: string): string {
  if (part === "starterQuestion") return "starter";
  if (part === "satQuestion") return "SAT";
  return "question";
}

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    setItems(buildReviewItems(lessons, loadAttempts()));
  }, []);

  const lessonsRepresented = useMemo(() => {
    return new Set(items.map((item) => item.lessonId)).size;
  }, [items]);

  function resetProgress(): void {
    clearAttempts();
    setItems([]);
  }

  return (
    <main className="relative mx-auto w-full max-w-5xl px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden">
        <div className="absolute -left-20 top-5 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-orange-300/18 blur-3xl" />
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-white/85 bg-white/82 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.09)] backdrop-blur-sm md:p-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-200 via-orange-300/80 to-amber-200" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-colors duration-150 hover:bg-slate-50"
            >
              ← Back to home
            </Link>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Review missed items</h1>
            <p className="text-sm text-slate-600 md:text-base">
              This list is generated from local attempts so you can quickly revisit weak spots.
            </p>
          </div>

          <button
            type="button"
            onClick={resetProgress}
            className="inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
          >
            Clear local progress
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Missed prompts</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{items.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lessons impacted</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{lessonsRepresented}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{items.length === 0 ? "Clear" : "Practice"}</p>
          </div>
        </div>
      </header>

      <section className="mt-8">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-[0_12px_32px_rgba(6,95,70,0.12)]">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">No review queue</p>
            <h2 className="mt-2 text-2xl font-semibold text-emerald-900">No missed items right now.</h2>
            <p className="mt-2 max-w-2xl text-sm text-emerald-800">
              Keep the streak going by opening a new lesson or replaying one you already started.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex h-10 items-center rounded-full border border-emerald-700 bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              Return to lessons
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <li
                key={`${item.lessonId}-${item.itemId}`}
                className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.lessonTitle}</p>
                <p className="mt-3 text-base font-semibold leading-snug text-slate-900">Starter: {item.prompt}</p>
                {item.satPrompt ? <p className="mt-1 text-sm leading-relaxed text-slate-600">SAT: {item.satPrompt}</p> : null}

                <p className="mt-3 text-xs text-slate-500">
                  Missed part(s): {item.missedParts.map((part) => formatPart(part)).join(", ")}
                </p>

                <Link
                  href={`/lesson/${item.lessonId}`}
                  className="mt-4 inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  Reopen lesson
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
