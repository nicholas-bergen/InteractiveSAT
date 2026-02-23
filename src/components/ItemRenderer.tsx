"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import katex from "katex";
import Image from "next/image";

import BalanceScaleWidget from "@/components/widgets/BalanceScaleWidget";
import SingleDigitalScaleWidget from "@/components/widgets/SingleDigitalScaleWidget";
import { BalanceState, LessonItem, StudentResponse } from "@/lib/types";

interface ItemRendererProps {
  item: LessonItem;
  onSubmit: (response: StudentResponse) => void;
}

function MathBlock({ latex }: { latex: string }) {
  const rendered = useMemo(
    () => katex.renderToString(latex, { displayMode: true, throwOnError: false }),
    [latex]
  );

  return <div className="rounded-md bg-slate-50 px-3 py-2 text-slate-900" dangerouslySetInnerHTML={{ __html: rendered }} />;
}

export default function ItemRenderer({ item, onSubmit }: ItemRendererProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [satSelectedIndex, setSatSelectedIndex] = useState<number | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [interactiveValue, setInteractiveValue] = useState<BalanceState | null>(null);
  const [mcqPhase, setMcqPhase] = useState<"starter" | "sat">("starter");

  // Reset local UI state whenever we move to another item.
  useEffect(() => {
    setSelectedIndex(null);
    setSatSelectedIndex(null);
    setFreeTextAnswer("");
    setInteractiveValue(null);
    setMcqPhase("starter");
  }, [item.id]);

  if (item.type === "mcq") {
    const hasSatPart = Boolean(item.satQuestion);
    const isStarterPhase = !hasSatPart || mcqPhase === "starter";

    const handleStarterSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const questionPart = hasSatPart ? "starterQuestion" : "single";
      onSubmit({ kind: "mcq", selectedIndex, questionPart });

      // Move to part 2 only after a correct starter answer.
      if (hasSatPart && selectedIndex === item.answerIndex) {
        setMcqPhase("sat");
        setSelectedIndex(null);
      }
    };

    const handleSatSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit({ kind: "mcq", selectedIndex: satSelectedIndex, questionPart: "satQuestion" });
    };

    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-lg font-medium text-slate-900">{item.prompt}</p>
        {item.visualWidget?.id === "singleDigitalScale" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <SingleDigitalScaleWidget config={item.visualWidget.config} />
          </div>
        ) : null}

        {isStarterPhase ? (
          <form onSubmit={handleStarterSubmit} className="space-y-3">
            <div className="space-y-2">
              {item.choices.map((choice, choiceIndex) => (
                <label key={choice} className="flex items-center gap-2 rounded-md border border-slate-200 p-3">
                  <input
                    type="radio"
                    name={`mcq-starter-${item.id}`}
                    checked={selectedIndex === choiceIndex}
                    onChange={() => setSelectedIndex(choiceIndex)}
                  />
                  <span className="text-sm text-slate-700">{choice}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={selectedIndex === null}
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit answer
            </button>
          </form>
        ) : null}

        {!isStarterPhase && item.satQuestion ? (
          <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-base font-medium text-slate-900">{item.satQuestion.prompt}</p>
            {item.satQuestion.mathLatex ? <MathBlock latex={item.satQuestion.mathLatex} /> : null}
            {item.satQuestion.imageSrc ? (
              <Image
                src={item.satQuestion.imageSrc}
                alt={item.satQuestion.imageAlt ?? "SAT question figure"}
                width={1200}
                height={800}
                className="max-h-80 w-full rounded-md border border-slate-200 object-contain"
              />
            ) : null}

            <form onSubmit={handleSatSubmit} className="space-y-3">
              <div className="space-y-2">
                {item.satQuestion.choices.map((choice, choiceIndex) => (
                  <label key={choice} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
                    <input
                      type="radio"
                      name={`mcq-sat-${item.id}`}
                      checked={satSelectedIndex === choiceIndex}
                      onChange={() => setSatSelectedIndex(choiceIndex)}
                    />
                    <span className="text-sm text-slate-700">{choice}</span>
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={satSelectedIndex === null}
                className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit answer
              </button>
            </form>
          </section>
        ) : null}
      </div>
    );
  }

  if (item.type === "freeResponse") {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit({ kind: "freeResponse", text: freeTextAnswer });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-lg font-medium text-slate-900">{item.prompt}</p>
        <input
          value={freeTextAnswer}
          onChange={(event) => setFreeTextAnswer(event.target.value)}
          placeholder={item.placeholder ?? "Type your answer"}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={freeTextAnswer.trim().length === 0}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit answer
        </button>
      </form>
    );
  }

  if (item.type === "interactive" && item.widget === "balanceScale") {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit({ kind: "interactive", value: interactiveValue });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-lg font-medium text-slate-900">{item.prompt}</p>
        <BalanceScaleWidget
          leftMass={item.config.leftMass}
          rightMass={item.config.rightMass}
          value={interactiveValue}
          onChange={setInteractiveValue}
        />
        <button
          type="submit"
          disabled={interactiveValue === null}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit answer
        </button>
      </form>
    );
  }

  return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unsupported item type.</p>;
}
