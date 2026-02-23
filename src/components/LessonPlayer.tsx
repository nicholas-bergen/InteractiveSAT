"use client";

import { useMemo, useState } from "react";

import ItemRenderer from "@/components/ItemRenderer";
import Stepper from "@/components/Stepper";
import { gradeResponse } from "@/lib/grading";
import { Lesson, StudentResponse } from "@/lib/types";
import { saveAttempt } from "@/lib/storage";

interface LessonPlayerProps {
  lesson: Lesson;
}

export default function LessonPlayer({ lesson }: LessonPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentItem = useMemo(() => lesson.items[currentIndex], [lesson.items, currentIndex]);

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

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{lesson.title}</h1>
        <p className="mt-2 text-sm text-slate-700">{lesson.description}</p>
      </header>

      <ItemRenderer item={currentItem} onSubmit={handleAnswerSubmit} />

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
