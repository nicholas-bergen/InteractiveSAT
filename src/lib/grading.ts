import { GradeResult, LessonItem, StudentResponse } from "@/lib/types";

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

// Grading is centralized so every page/component uses the same rules.
export function gradeResponse(item: LessonItem, response: StudentResponse): GradeResult {
  if (item.type === "mcq") {
    if (response.kind !== "mcq") {
      return { isCorrect: false, message: "Response type mismatch." };
    }

    if (response.selectedIndex === null) {
      return { isCorrect: false, message: "Please choose an option first." };
    }

    if (item.satQuestion && response.questionPart === "satQuestion") {
      const isCorrect = response.selectedIndex === item.satQuestion.answerIndex;
      return {
        isCorrect,
        message: isCorrect ? "Correct." : "Not quite. Try again."
      };
    }

    const isCorrect = response.selectedIndex === item.answerIndex;
    const isStarterWithSat = Boolean(item.satQuestion && response.questionPart === "starterQuestion");
    return {
      isCorrect,
      message: isCorrect
        ? isStarterWithSat
          ? "Correct, now solve part 2."
          : "Correct."
        : "Not quite. Try again."
    };
  }

  if (item.type === "freeResponse") {
    if (response.kind !== "freeResponse") {
      return { isCorrect: false, message: "Response type mismatch." };
    }

    const studentAnswer = normalizeText(response.text);
    const accepted = item.acceptableAnswers.map((answer) => normalizeText(answer));
    const isCorrect = accepted.includes(studentAnswer);

    return {
      isCorrect,
      message: isCorrect ? "Correct." : "Not quite. Try again."
    };
  }

  if (item.type === "interactive") {
    if (response.kind !== "interactive") {
      return { isCorrect: false, message: "Response type mismatch." };
    }

    if (item.widget === "balanceScale") {
      if (response.widget !== "balanceScale") {
        return { isCorrect: false, message: "Response type mismatch." };
      }

      if (!response.value) {
        return { isCorrect: false, message: "Please make a choice in the widget first." };
      }

      const isCorrect = response.value === item.expectedState;
      return {
        isCorrect,
        message: isCorrect ? "Correct." : "Not quite. Try again."
      };
    }

    if (response.widget !== "dragDropEquation") {
      return { isCorrect: false, message: "Response type mismatch." };
    }

    if (response.isCorrect === null) {
      return { isCorrect: false, message: "Please fill all boxes and check your answer first." };
    }

    return {
      isCorrect: response.isCorrect,
      message: response.isCorrect ? "Correct." : "Not quite. Try again."
    };
  }

  return { isCorrect: false, message: "Unsupported item type." };
}
