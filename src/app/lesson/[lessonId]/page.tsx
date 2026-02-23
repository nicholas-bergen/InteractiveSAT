import { notFound } from "next/navigation";

import LessonPlayer from "@/components/LessonPlayer";
import { getLessonById } from "@/lib/lessons";

interface LessonPageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="min-h-screen w-full bg-white">
      <LessonPlayer lesson={lesson} />
    </main>
  );
}
