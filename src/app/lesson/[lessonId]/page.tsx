import Link from "next/link";
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
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      <Link href="/" className="mb-5 inline-flex text-sm font-medium text-brand-700 hover:text-brand-600">
        Back to home
      </Link>

      <LessonPlayer lesson={lesson} />
    </main>
  );
}
