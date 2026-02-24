"use client";

import { FormEvent, KeyboardEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import Image from "next/image";
import { useRouter } from "next/navigation";

import BalanceScaleWidget from "@/components/widgets/BalanceScaleWidget";
import DragDropEquationWidget, { DragDropEquationWidgetHandle } from "@/components/widgets/DragDropEquationWidget";
import SingleDigitalScaleWidget from "@/components/widgets/SingleDigitalScaleWidget";
import { BalanceState, LessonItem, StudentResponse, VisualWidget } from "@/lib/types";

type McqOutcome = "idle" | "incorrect" | "correct" | "revealed";
type McqPhase = "starter" | "sat";
type ChoiceIcon = "check" | "x" | null;

interface ItemRendererProps {
  item: LessonItem;
  onSubmit: (response: StudentResponse) => void;
  onNext?: () => void;
}

interface ChoiceVisualState {
  classes: string;
  icon: ChoiceIcon;
  iconClasses?: string;
}

interface McqControlsProps {
  phase: McqPhase;
  choices: string[];
  renderChoicesAsMath: boolean;
  selectedIndex: number | null;
  answerIndex: number;
  outcome: McqOutcome;
  isCompactLayout: boolean;
  choiceRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  primaryActionRef: MutableRefObject<HTMLButtonElement | null>;
  continueLabel: string;
  onChoiceKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    phase: McqPhase,
    choiceIndex: number,
    currentSelection: number | null,
    choiceCount: number,
    isLocked: boolean
  ) => void;
  onChoiceToggle: (choiceIndex: number | null) => void;
  onCheck: () => void;
  onTryAgain: () => void;
  onSeeAnswer: () => void;
  onContinue: () => void;
  onPrimaryShortcut: () => void;
}

function MathBlock({ latex }: { latex: string }) {
  const rendered = useMemo(
    () => katex.renderToString(latex, { displayMode: true, throwOnError: false }),
    [latex]
  );

  return <div className="rounded-md bg-slate-50 px-3 py-2 text-slate-900" dangerouslySetInnerHTML={{ __html: rendered }} />;
}

function MathInline({ latex, className }: { latex: string; className?: string }) {
  const rendered = useMemo(
    () => katex.renderToString(latex, { displayMode: false, throwOnError: false }),
    [latex]
  );

  return <span className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
}

function renderVisualWidget(widget: VisualWidget) {
  switch (widget.id) {
    case "singleDigitalScale":
      return <SingleDigitalScaleWidget config={widget.config} />;
    default:
      return <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Unsupported visual widget.</p>;
  }
}

function getNextChoiceIndex(currentIndex: number, key: string, totalChoices: number, columns: number): number {
  const maxColumns = Math.max(1, columns);
  const row = Math.floor(currentIndex / maxColumns);
  const column = currentIndex % maxColumns;

  if (key === "ArrowRight") {
    const next = currentIndex + 1;
    return column < maxColumns - 1 && next < totalChoices ? next : currentIndex;
  }

  if (key === "ArrowLeft") {
    const previous = currentIndex - 1;
    return column > 0 && previous >= 0 ? previous : currentIndex;
  }

  if (key === "ArrowDown") {
    const nextRow = row + 1;
    const next = nextRow * maxColumns + column;
    return next < totalChoices ? next : currentIndex;
  }

  if (key === "ArrowUp") {
    const previousRow = row - 1;
    const previous = previousRow * maxColumns + column;
    return previous >= 0 ? previous : currentIndex;
  }

  return currentIndex;
}

function getChoiceVisualState({
  choiceIndex,
  selectedIndex,
  answerIndex,
  outcome
}: {
  choiceIndex: number;
  selectedIndex: number | null;
  answerIndex: number;
  outcome: McqOutcome;
}): ChoiceVisualState {
  if (outcome === "idle") {
    if (choiceIndex === selectedIndex) {
      return {
        classes:
          "border-blue-500 bg-blue-50 text-blue-700 shadow-[0_0_0_2px_rgba(59,130,246,0.15)]",
        icon: null
      };
    }

    return {
      classes:
        "border-slate-300 bg-transparent text-slate-900 hover:border-blue-300 hover:bg-blue-50/50",
      icon: null
    };
  }

  if (outcome === "correct") {
    if (choiceIndex === selectedIndex) {
      return {
        classes:
          "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_2px_rgba(16,185,129,0.15)] motion-safe:animate-[mcq-result-pop_180ms_ease-out]",
        icon: "check",
        iconClasses: "bg-emerald-500 text-white"
      };
    }

    return {
      classes: "border-slate-200 bg-transparent text-slate-400",
      icon: null
    };
  }

  if (outcome === "incorrect") {
    if (choiceIndex === selectedIndex) {
      return {
        classes:
          "border-slate-400 bg-slate-100 text-slate-700 shadow-[0_0_0_2px_rgba(100,116,139,0.15)] motion-safe:animate-[mcq-result-pop_180ms_ease-out]",
        icon: "x",
        iconClasses: "bg-slate-300 text-slate-700"
      };
    }

    return {
      classes: "border-slate-200 bg-transparent text-slate-400",
      icon: null
    };
  }

  if (choiceIndex === answerIndex) {
    return {
      classes: "border-slate-500 bg-slate-100 text-slate-900 shadow-[0_0_0_2px_rgba(71,85,105,0.14)]",
      icon: "check",
      iconClasses: "bg-slate-500 text-white"
    };
  }

  if (choiceIndex === selectedIndex) {
    return {
      classes: "border-slate-400 bg-slate-100 text-slate-700",
      icon: "x",
      iconClasses: "bg-slate-300 text-slate-700"
    };
  }

  return {
    classes: "border-slate-200 bg-transparent text-slate-400",
    icon: null
  };
}

function iconSymbol(icon: ChoiceIcon): string {
  if (icon === "check") {
    return "✓";
  }

  if (icon === "x") {
    return "✕";
  }

  return "";
}

function McqControls({
  phase,
  choices,
  renderChoicesAsMath,
  selectedIndex,
  answerIndex,
  outcome,
  isCompactLayout,
  choiceRefs,
  primaryActionRef,
  continueLabel,
  onChoiceKeyDown,
  onChoiceToggle,
  onCheck,
  onTryAgain,
  onSeeAnswer,
  onContinue,
  onPrimaryShortcut
}: McqControlsProps) {
  const isLocked = outcome !== "idle";
  const checkEnabled = selectedIndex !== null;
  const columnsClass = isCompactLayout ? "grid-cols-1" : "grid-cols-2";

  return (
    <div
      className="w-full"
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
          return;
        }

        event.preventDefault();
        onPrimaryShortcut();
      }}
    >
      <div role="radiogroup" aria-label="Answer choices" className={`grid w-full gap-2.5 sm:gap-3 ${columnsClass}`}>
        {choices.map((choice, choiceIndex) => {
          const isSelected = selectedIndex === choiceIndex;
          const visualState = getChoiceVisualState({
            choiceIndex,
            selectedIndex,
            answerIndex,
            outcome
          });

          return (
            <button
              key={`${phase}-${choiceIndex}-${choice}`}
              ref={(element) => {
                choiceRefs.current[choiceIndex] = element;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isLocked}
              disabled={isLocked}
              onClick={() => {
                if (isLocked) {
                  return;
                }

                onChoiceToggle(isSelected ? null : choiceIndex);
              }}
              onKeyDown={(event) => onChoiceKeyDown(event, phase, choiceIndex, selectedIndex, choices.length, isLocked)}
              className={`relative flex h-12 w-full items-center justify-center rounded-xl border px-3 text-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 disabled:cursor-default sm:h-[3rem] sm:text-xl ${visualState.classes}`}
            >
              {renderChoicesAsMath ? (
                <MathInline latex={choice} className={isSelected ? "font-semibold" : "font-medium"} />
              ) : (
                <span className={isSelected ? "font-semibold" : "font-medium"}>{choice}</span>
              )}
              {visualState.icon ? (
                <span
                  aria-hidden
                  className={`absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-md text-xs font-bold shadow-sm ${visualState.iconClasses}`}
                >
                  {iconSymbol(visualState.icon)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {outcome === "idle" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur-sm sm:py-4">
          <div className="mx-auto flex max-w-3xl justify-center">
            <button
              ref={primaryActionRef}
              type="button"
              onClick={onCheck}
              disabled={!checkEnabled}
              className={`h-12 w-full max-w-[22rem] rounded-full border text-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:h-[3.1rem] ${
                checkEnabled
                  ? "border-slate-800 bg-slate-800 text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.55)] hover:bg-slate-700 active:translate-y-px"
                  : "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-500"
              }`}
            >
              Check
            </button>
          </div>
        </div>
      ) : null}

      {outcome === "incorrect" ? (
        <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
          <div className="w-full max-w-[34rem] rounded-2xl border border-amber-300 bg-amber-200 px-4 py-4 shadow-[0_14px_30px_rgba(120,53,15,0.12)] sm:px-5">
            <p className="text-xl font-medium text-amber-950">That&apos;s incorrect.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <button
                ref={primaryActionRef}
                type="button"
                onClick={onTryAgain}
                className="h-10 rounded-full border border-slate-900 bg-slate-900 px-5 text-lg font-semibold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] transition-all duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onSeeAnswer}
                className="h-10 rounded-full border border-amber-400 bg-amber-300 px-5 text-lg font-semibold text-amber-950 shadow-[inset_0_-2px_0_rgba(120,53,15,0.18)] transition-all duration-150 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              >
                See answer
              </button>
              <span className="ml-auto text-2xl text-amber-900/80" aria-hidden>
                ⚑
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {outcome === "correct" || outcome === "revealed" ? (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur-sm sm:py-4 ${
            outcome === "correct"
              ? "border-emerald-200 bg-emerald-100/95"
              : "border-slate-300 bg-slate-200/95"
          }`}
        >
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <span className="text-2xl" aria-hidden>
              {outcome === "correct" ? "🎉" : "🔎"}
            </span>
            <p className="text-2xl font-semibold text-slate-900">
              {outcome === "correct" ? "Correct!" : "Here&apos;s the answer"}
            </p>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                disabled
                className="h-10 rounded-full border border-slate-300 bg-slate-200 px-5 text-lg font-semibold text-slate-500"
              >
                Why?
              </button>
              <button
                ref={primaryActionRef}
                type="button"
                onClick={onContinue}
                className={`h-10 rounded-full px-6 text-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                  outcome === "correct"
                    ? "border border-emerald-600 bg-emerald-500 text-white shadow-[inset_0_-2px_0_rgba(22,101,52,0.45)] hover:bg-emerald-400"
                    : "border border-slate-900 bg-slate-800 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] hover:bg-slate-700"
                }`}
              >
                {continueLabel}
              </button>
              <span className="text-2xl text-slate-500" aria-hidden>
                ⚑
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ItemRenderer({ item, onSubmit, onNext }: ItemRendererProps) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [satSelectedIndex, setSatSelectedIndex] = useState<number | null>(null);
  const [freeTextAnswer, setFreeTextAnswer] = useState("");
  const [interactiveValue, setInteractiveValue] = useState<BalanceState | null>(null);
  const [mcqPhase, setMcqPhase] = useState<McqPhase>("starter");
  const [starterOutcome, setStarterOutcome] = useState<McqOutcome>("idle");
  const [satOutcome, setSatOutcome] = useState<McqOutcome>("idle");
  const [dragDropOutcome, setDragDropOutcome] = useState<McqOutcome>("idle");
  const [dragDropCheckEnabled, setDragDropCheckEnabled] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const isMcqItem = item.type === "mcq";
  const isDragDropItem = item.type === "interactive" && item.widget === "dragDropEquation";
  const hasSatPart = isMcqItem && Boolean(item.satQuestion);
  const isStarterPhase = isMcqItem && (!hasSatPart || mcqPhase === "starter");

  const starterChoiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const satChoiceRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const starterPrimaryActionRef = useRef<HTMLButtonElement | null>(null);
  const satPrimaryActionRef = useRef<HTMLButtonElement | null>(null);
  const dragDropWidgetRef = useRef<DragDropEquationWidgetHandle | null>(null);
  const dragDropPrimaryActionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setIsCompactLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Reset local UI state whenever we move to another item.
  useEffect(() => {
    setSelectedIndex(null);
    setSatSelectedIndex(null);
    setFreeTextAnswer("");
    setInteractiveValue(null);
    setMcqPhase("starter");
    setStarterOutcome("idle");
    setSatOutcome("idle");
    setDragDropOutcome("idle");
    setDragDropCheckEnabled(false);
    starterChoiceRefs.current = [];
    satChoiceRefs.current = [];
    dragDropWidgetRef.current = null;
  }, [item.id]);

  useEffect(() => {
    if (!isMcqItem) {
      return;
    }

    if (isStarterPhase && starterOutcome !== "idle") {
      starterPrimaryActionRef.current?.focus();
    }
  }, [isMcqItem, isStarterPhase, starterOutcome]);

  useEffect(() => {
    if (!isMcqItem) {
      return;
    }

    if (!isStarterPhase && satOutcome !== "idle") {
      satPrimaryActionRef.current?.focus();
    }
  }, [isMcqItem, isStarterPhase, satOutcome]);

  useEffect(() => {
    if (!isDragDropItem || dragDropOutcome === "idle") {
      return;
    }

    dragDropPrimaryActionRef.current?.focus();
  }, [isDragDropItem, dragDropOutcome]);

  if (item.type === "mcq") {
    const columns = isCompactLayout ? 1 : 2;

    const focusFirstChoice = (phase: McqPhase) => {
      const refs = phase === "starter" ? starterChoiceRefs : satChoiceRefs;
      requestAnimationFrame(() => refs.current[0]?.focus());
    };

    const handleChoiceKeyDown = (
      event: KeyboardEvent<HTMLButtonElement>,
      phase: McqPhase,
      _choiceIndex: number,
      currentSelection: number | null,
      choiceCount: number,
      isLocked: boolean
    ) => {
      if (isLocked) {
        return;
      }

      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        return;
      }

      if (!event.key.startsWith("Arrow")) {
        return;
      }

      event.preventDefault();

      const refs = phase === "starter" ? starterChoiceRefs : satChoiceRefs;
      if (currentSelection === null) {
        if (phase === "starter") {
          setSelectedIndex(0);
        } else {
          setSatSelectedIndex(0);
        }
        refs.current[0]?.focus();
        return;
      }

      const nextIndex = getNextChoiceIndex(currentSelection, event.key, choiceCount, columns);
      if (phase === "starter") {
        setSelectedIndex(nextIndex);
      } else {
        setSatSelectedIndex(nextIndex);
      }
      refs.current[nextIndex]?.focus();
    };

    const handleStarterCheck = () => {
      if (selectedIndex === null || starterOutcome !== "idle") {
        return;
      }

      const isCorrect = selectedIndex === item.answerIndex;
      const questionPart = hasSatPart ? "starterQuestion" : "single";
      onSubmit({ kind: "mcq", selectedIndex, questionPart });

      // Preserve existing two-part flow: correct starter answer opens SAT part.
      if (hasSatPart && isCorrect) {
        setMcqPhase("sat");
        setSelectedIndex(null);
        setStarterOutcome("idle");
        return;
      }

      setStarterOutcome(isCorrect ? "correct" : "incorrect");
    };

    const handleSatCheck = () => {
      if (satSelectedIndex === null || satOutcome !== "idle" || !item.satQuestion) {
        return;
      }

      const isCorrect = satSelectedIndex === item.satQuestion.answerIndex;
      onSubmit({ kind: "mcq", selectedIndex: satSelectedIndex, questionPart: "satQuestion" });
      setSatOutcome(isCorrect ? "correct" : "incorrect");
    };

    const handleStarterTryAgain = () => {
      setStarterOutcome("idle");
      setSelectedIndex(null);
      focusFirstChoice("starter");
    };

    const handleSatTryAgain = () => {
      setSatOutcome("idle");
      setSatSelectedIndex(null);
      focusFirstChoice("sat");
    };

    const handleStarterSeeAnswer = () => {
      if (starterOutcome !== "incorrect") {
        return;
      }

      setStarterOutcome("revealed");
    };

    const handleSatSeeAnswer = () => {
      if (satOutcome !== "incorrect") {
        return;
      }

      setSatOutcome("revealed");
    };

    const handleContinue = () => {
      if (onNext) {
        onNext();
        return;
      }

      router.push("/");
    };

    const continueLabel = "Continue";
    const handleStarterPrimaryShortcut = () => {
      if (starterOutcome === "idle") {
        if (selectedIndex !== null) {
          handleStarterCheck();
        }
        return;
      }

      if (starterOutcome === "incorrect") {
        handleStarterTryAgain();
        return;
      }

      handleContinue();
    };

    const handleSatPrimaryShortcut = () => {
      if (satOutcome === "idle") {
        if (satSelectedIndex !== null) {
          handleSatCheck();
        }
        return;
      }

      if (satOutcome === "incorrect") {
        handleSatTryAgain();
        return;
      }

      handleContinue();
    };

    return (
      <div className="w-full max-w-[32rem] pb-16 sm:max-w-[34rem] sm:pb-20">
        <div className="space-y-4 sm:space-y-5">
          {isStarterPhase ? (
            <p className="text-xl font-medium leading-[1.35] tracking-tight text-slate-900 sm:text-2xl">
              {item.prompt}
            </p>
          ) : null}

          {!isStarterPhase && item.satQuestion ? (
            <p className="text-xl font-medium leading-[1.35] tracking-tight text-slate-900 sm:text-2xl">
              {item.satQuestion.prompt}
            </p>
          ) : null}

          {isStarterPhase && item.visualWidget ? (
            <div className="mx-auto flex w-full max-w-[19rem] justify-center sm:max-w-[21.5rem]">
              {renderVisualWidget(item.visualWidget)}
            </div>
          ) : null}

          {!isStarterPhase && item.satQuestion?.mathLatex ? (
            <MathBlock latex={item.satQuestion.mathLatex} />
          ) : null}

          {!isStarterPhase && item.satQuestion?.imageSrc ? (
            <Image
              src={item.satQuestion.imageSrc}
              alt={item.satQuestion.imageAlt ?? "SAT question figure"}
              width={1200}
              height={800}
              className="max-h-80 w-full rounded-md border border-slate-200 object-contain"
            />
          ) : null}

          {isStarterPhase ? (
            <McqControls
              phase="starter"
              choices={item.choices}
              renderChoicesAsMath={Boolean(item.choicesLatex)}
              selectedIndex={selectedIndex}
              answerIndex={item.answerIndex}
              outcome={starterOutcome}
              isCompactLayout={isCompactLayout}
              choiceRefs={starterChoiceRefs}
              primaryActionRef={starterPrimaryActionRef}
              continueLabel={continueLabel}
              onChoiceKeyDown={handleChoiceKeyDown}
              onChoiceToggle={setSelectedIndex}
              onCheck={handleStarterCheck}
              onTryAgain={handleStarterTryAgain}
              onSeeAnswer={handleStarterSeeAnswer}
              onContinue={handleContinue}
              onPrimaryShortcut={handleStarterPrimaryShortcut}
            />
          ) : null}

          {!isStarterPhase && item.satQuestion ? (
            <McqControls
              phase="sat"
              choices={item.satQuestion.choices}
              renderChoicesAsMath={Boolean(item.satQuestion.choicesLatex)}
              selectedIndex={satSelectedIndex}
              answerIndex={item.satQuestion.answerIndex}
              outcome={satOutcome}
              isCompactLayout={isCompactLayout}
              choiceRefs={satChoiceRefs}
              primaryActionRef={satPrimaryActionRef}
              continueLabel={continueLabel}
              onChoiceKeyDown={handleChoiceKeyDown}
              onChoiceToggle={setSatSelectedIndex}
              onCheck={handleSatCheck}
              onTryAgain={handleSatTryAgain}
              onSeeAnswer={handleSatSeeAnswer}
              onContinue={handleContinue}
              onPrimaryShortcut={handleSatPrimaryShortcut}
            />
          ) : null}
        </div>
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
      onSubmit({ kind: "interactive", widget: "balanceScale", value: interactiveValue });
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

  if (item.type === "interactive" && item.widget === "dragDropEquation") {
    const handleCheck = () => {
      if (dragDropOutcome !== "idle") {
        return;
      }

      const result = dragDropWidgetRef.current?.check();
      if (!result) {
        return;
      }

      onSubmit({ kind: "interactive", widget: "dragDropEquation", isCorrect: result.isCorrect });
      setDragDropOutcome(result.isCorrect ? "correct" : "incorrect");
    };

    const handleTryAgain = () => {
      dragDropWidgetRef.current?.retry();
      setDragDropOutcome("idle");
    };

    const handleSeeAnswer = () => {
      if (dragDropOutcome !== "incorrect") {
        return;
      }

      dragDropWidgetRef.current?.showAnswer();
      setDragDropOutcome("revealed");
    };

    const handleContinue = () => {
      if (onNext) {
        onNext();
        return;
      }

      router.push("/");
    };

    return (
      <div className="w-full max-w-[32rem] pb-16 sm:max-w-[34rem] sm:pb-20">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xl font-medium leading-[1.35] tracking-tight text-slate-900 sm:text-2xl">{item.prompt}</p>

          {item.config.pairedVisualWidget ? (
            <div className="mx-auto flex w-full max-w-[19rem] justify-center sm:max-w-[21.5rem]">
              {renderVisualWidget(item.config.pairedVisualWidget)}
            </div>
          ) : null}

          <DragDropEquationWidget ref={dragDropWidgetRef} config={item.config} onFilledChange={setDragDropCheckEnabled} />
        </div>

        {dragDropOutcome === "idle" ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur-sm sm:py-4">
            <div className="mx-auto flex max-w-3xl justify-center">
              <button
                type="button"
                onClick={handleCheck}
                disabled={!dragDropCheckEnabled}
                className={`h-12 w-full max-w-[22rem] rounded-full border text-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 sm:h-[3.1rem] ${
                  dragDropCheckEnabled
                    ? "border-slate-800 bg-slate-800 text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.55)] hover:bg-slate-700 active:translate-y-px"
                    : "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-500"
                }`}
              >
                Check
              </button>
            </div>
          </div>
        ) : null}

        {dragDropOutcome === "incorrect" ? (
          <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
            <div className="w-full max-w-[34rem] rounded-2xl border border-amber-300 bg-amber-200 px-4 py-4 shadow-[0_14px_30px_rgba(120,53,15,0.12)] sm:px-5">
              <p className="text-xl font-medium text-amber-950">That&apos;s incorrect.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <button
                  ref={dragDropPrimaryActionRef}
                  type="button"
                  onClick={handleTryAgain}
                  className="h-10 rounded-full border border-slate-900 bg-slate-900 px-5 text-lg font-semibold text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] transition-all duration-150 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={handleSeeAnswer}
                  className="h-10 rounded-full border border-amber-400 bg-amber-300 px-5 text-lg font-semibold text-amber-950 shadow-[inset_0_-2px_0_rgba(120,53,15,0.18)] transition-all duration-150 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                >
                  See answer
                </button>
                <span className="ml-auto text-2xl text-amber-900/80" aria-hidden>
                  ⚑
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {dragDropOutcome === "correct" || dragDropOutcome === "revealed" ? (
          <div
            className={`fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur-sm sm:py-4 ${
              dragDropOutcome === "correct"
                ? "border-emerald-200 bg-emerald-100/95"
                : "border-slate-300 bg-slate-200/95"
            }`}
          >
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              <span className="text-2xl" aria-hidden>
                {dragDropOutcome === "correct" ? "🎉" : "🔎"}
              </span>
              <p className="text-2xl font-semibold text-slate-900">
                {dragDropOutcome === "correct" ? "Correct!" : "Here&apos;s the answer"}
              </p>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  disabled
                  className="h-10 rounded-full border border-slate-300 bg-slate-200 px-5 text-lg font-semibold text-slate-500"
                >
                  Why?
                </button>
                <button
                  ref={dragDropPrimaryActionRef}
                  type="button"
                  onClick={handleContinue}
                  className={`h-10 rounded-full px-6 text-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                    dragDropOutcome === "correct"
                      ? "border border-emerald-600 bg-emerald-500 text-white shadow-[inset_0_-2px_0_rgba(22,101,52,0.45)] hover:bg-emerald-400"
                      : "border border-slate-900 bg-slate-800 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.35)] hover:bg-slate-700"
                  }`}
                >
                  Continue
                </button>
                <span className="text-2xl text-slate-500" aria-hidden>
                  ⚑
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unsupported item type.</p>;
}
