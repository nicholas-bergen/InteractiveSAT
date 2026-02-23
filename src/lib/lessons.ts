import { lessons } from "@/content/lessons";
import { Lesson } from "@/lib/types";

export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}
