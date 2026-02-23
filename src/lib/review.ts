import { Attempt, Lesson, ReviewItem } from "@/lib/types";
import { loadAttempts } from "@/lib/storage";

function partOrder(part: string): number {
  if (part === "starterQuestion") return 0;
  if (part === "satQuestion") return 1;
  return 2;
}

// Review includes an item if any part was ever answered incorrectly.
export function buildReviewItems(lessons: Lesson[], attempts: Attempt[] = loadAttempts()): ReviewItem[] {
  const reviewItems: ReviewItem[] = [];

  for (const lesson of lessons) {
    for (const item of lesson.items) {
      const incorrectAttempts = attempts.filter(
        (attempt) => attempt.lessonId === lesson.id && attempt.itemId === item.id && !attempt.result.isCorrect
      );

      if (incorrectAttempts.length > 0) {
        const missedParts = Array.from(new Set(incorrectAttempts.map((attempt) => attempt.questionPart))).sort(
          (a, b) => partOrder(a) - partOrder(b)
        );

        reviewItems.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          itemId: item.id,
          prompt: item.prompt,
          satPrompt: item.type === "mcq" ? item.satQuestion?.prompt : undefined,
          missedParts
        });
      }
    }
  }

  return reviewItems;
}
