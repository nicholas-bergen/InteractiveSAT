"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  function resetProgress(): void {
    clearAttempts();
    setItems([]);
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-8">
      <header className="space-y-2">
        <Link href="/" className="inline-flex text-sm font-medium text-brand-700 hover:text-brand-600">
          Back to home
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Review missed items</h1>
        <p className="text-sm text-slate-700">
          This page is local-first: it is generated from items that were answered incorrectly at least once.
        </p>
      </header>

      <button
        type="button"
        onClick={resetProgress}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
      >
        Clear local progress
      </button>

      {items.length === 0 ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          No missed items right now.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.lessonId}-${item.itemId}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.lessonTitle}</p>
              <p className="mt-1 text-sm font-medium text-slate-900">Starter: {item.prompt}</p>
              {item.satPrompt ? <p className="mt-1 text-sm text-slate-700">SAT: {item.satPrompt}</p> : null}
              <p className="mt-2 text-xs text-slate-500">
                Missed part(s): {item.missedParts.map((part) => formatPart(part)).join(", ")}
              </p>
              <Link
                href={`/lesson/${item.lessonId}`}
                className="mt-3 inline-flex text-sm font-medium text-brand-700 hover:text-brand-600"
              >
                Reopen lesson
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
