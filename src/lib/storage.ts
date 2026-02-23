import { Attempt, Lesson, LessonProgress, QuestionPart } from "@/lib/types";

const ATTEMPTS_STORAGE_KEY = "lesson-lab:attempts:v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeQuestionPart(value: unknown): QuestionPart {
  if (value === "starterQuestion" || value === "satQuestion") {
    return value;
  }

  return "single";
}

function normalizeAttempt(raw: Attempt | (Attempt & { questionPart?: unknown })): Attempt {
  return {
    ...raw,
    questionPart: normalizeQuestionPart(raw.questionPart)
  };
}

export function loadAttempts(): Attempt[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => normalizeAttempt(entry as Attempt & { questionPart?: unknown }));
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: Attempt): void {
  if (!canUseStorage()) {
    return;
  }

  const attempts = loadAttempts();

  // Keep only one incorrect log per lesson/item/part, even across repeated retries.
  if (!attempt.result.isCorrect) {
    const hasIncorrectAlready = attempts.some(
      (existing) =>
        existing.lessonId === attempt.lessonId &&
        existing.itemId === attempt.itemId &&
        existing.questionPart === attempt.questionPart &&
        !existing.result.isCorrect
    );

    if (hasIncorrectAlready) {
      return;
    }
  }

  attempts.push(attempt);
  window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
}

export function clearAttempts(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
}

function itemKey(lessonId: string, itemId: string): string {
  return `${lessonId}::${itemId}`;
}

// Many features (progress, review, analytics) need "latest attempt per item".
export function getLatestAttemptsMap(attempts: Attempt[]): Record<string, Attempt> {
  const latestByItem: Record<string, Attempt> = {};

  for (const attempt of attempts) {
    const key = itemKey(attempt.lessonId, attempt.itemId);
    const current = latestByItem[key];

    if (!current) {
      latestByItem[key] = attempt;
      continue;
    }

    const attemptTime = new Date(attempt.submittedAt).getTime();
    const currentTime = new Date(current.submittedAt).getTime();
    if (attemptTime >= currentTime) {
      latestByItem[key] = attempt;
    }
  }

  return latestByItem;
}

export function buildLessonProgress(lessons: Lesson[], attempts: Attempt[]): Record<string, LessonProgress> {
  const latestByItem = getLatestAttemptsMap(attempts);
  const progressByLesson: Record<string, LessonProgress> = {};

  for (const lesson of lessons) {
    let attemptedItems = 0;

    for (const item of lesson.items) {
      if (latestByItem[itemKey(lesson.id, item.id)]) {
        attemptedItems += 1;
      }
    }

    progressByLesson[lesson.id] = {
      lessonId: lesson.id,
      attemptedItems,
      totalItems: lesson.items.length
    };
  }

  return progressByLesson;
}
