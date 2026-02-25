"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ItemRenderer from "@/components/ItemRenderer";
import Stepper from "@/components/Stepper";
import { gradeResponse } from "@/lib/grading";
import { navigateWithTransition } from "@/lib/pageTransition";
import { Lesson, StudentResponse } from "@/lib/types";
import { saveAttempt } from "@/lib/storage";

interface LessonPlayerProps {
  lesson: Lesson;
}

export default function LessonPlayer({ lesson }: LessonPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctItemIds, setCorrectItemIds] = useState<Set<string>>(() => new Set());
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentItem = useMemo(() => lesson.items[currentIndex], [lesson.items, currentIndex]);
  const hasNextItem = currentIndex < lesson.items.length - 1;
  const completedCorrectCount = correctItemIds.size;
  const progressPercent = lesson.items.length === 0 ? 0 : (completedCorrectCount / lesson.items.length) * 100;
  const isImmersiveItem =
    currentItem.type === "mcq" ||
    (currentItem.type === "interactive" &&
      (currentItem.widget === "dragDropEquation" || currentItem.widget === "equationScale"));

  function handleAnswerSubmit(response: StudentResponse): void {
    // LessonPlayer controls grading + persistence so ItemRenderer can stay focused on UI.
    const grade = gradeResponse(currentItem, response);
    const questionPart = response.kind === "mcq" ? response.questionPart : "single";

    saveAttempt({
      lessonId: lesson.id,
      itemId: currentItem.id,
      questionPart,
      submittedAt: new Date().toISOString(),
      response,
      result: grade
    });

    // For two-part MCQ items, hide any optional hint/explanation after starter is correct.
    if (
      response.kind === "mcq" &&
      response.questionPart === "starterQuestion" &&
      grade.isCorrect &&
      currentItem.type === "mcq" &&
      currentItem.satQuestion
    ) {
      setShowHint(false);
      setShowExplanation(false);
    }

    if (grade.isCorrect) {
      const countsTowardProgress =
        currentItem.type !== "mcq" ||
        !currentItem.satQuestion ||
        (response.kind === "mcq" && response.questionPart === "satQuestion");

      if (countsTowardProgress) {
        setCorrectItemIds((current) => {
          if (current.has(currentItem.id)) {
            return current;
          }

          const next = new Set(current);
          next.add(currentItem.id);
          return next;
        });
      }
    }

    setResultMessage(grade.message);
    setIsCorrect(grade.isCorrect);
  }

  function moveToNext(): void {
    setCurrentIndex((current) => Math.min(current + 1, lesson.items.length - 1));
    setResultMessage(null);
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
  }

  function moveToPrevious(): void {
    setCurrentIndex((current) => Math.max(current - 1, 0));
    setResultMessage(null);
    setIsCorrect(null);
    setShowHint(false);
    setShowExplanation(false);
  }

  function exitLesson(): void {
    void navigateWithTransition(() => router.push("/"), "to-home");
  }

  if (isImmersiveItem) {
    return (
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-white text-slate-900">
        <header className="grid h-20 grid-cols-[auto_1fr_auto] items-center border-b border-slate-200 px-2 sm:px-4">
          <button
            type="button"
            onClick={exitLesson}
            aria-label="Exit lesson"
            className="h-11 w-11 rounded-md text-4xl leading-none text-slate-400 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            ×
          </button>

          <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-2 sm:gap-4 sm:px-4">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="h-11 w-11" aria-hidden />
        </header>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-36 pt-8 sm:pb-40">
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={moveToPrevious}
              aria-label="Previous step"
              className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-3xl text-slate-400 opacity-45 transition-all duration-150 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 sm:left-8"
            >
              ←
            </button>
          ) : null}

          <div className="flex w-full justify-center">
            <ItemRenderer item={currentItem} onSubmit={handleAnswerSubmit} onNext={hasNextItem ? moveToNext : undefined} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{lesson.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{lesson.description}</p>
      </header>

      <ItemRenderer item={currentItem} onSubmit={handleAnswerSubmit} onNext={hasNextItem ? moveToNext : undefined} />

      {resultMessage ? (
        <p
          className={`rounded-md border p-3 text-sm ${
            isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-800"
          }`}
        >
          {resultMessage}
        </p>
      ) : null}

      {showHint && currentItem.hint ? (
        <p className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">Hint: {currentItem.hint}</p>
      ) : null}

      {showExplanation && currentItem.explanation ? (
        <p className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">
          Explanation: {currentItem.explanation}
        </p>
      ) : null}

      <Stepper
        currentIndex={currentIndex}
        totalItems={lesson.items.length}
        showHint={showHint}
        showExplanation={showExplanation}
        onPrevious={moveToPrevious}
        onNext={moveToNext}
        onToggleHint={() => setShowHint((current) => !current)}
        onToggleExplanation={() => setShowExplanation((current) => !current)}
      />
    </section>
  );
}
