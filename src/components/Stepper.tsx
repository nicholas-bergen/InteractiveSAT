interface StepperProps {
  currentIndex: number;
  totalItems: number;
  showHint: boolean;
  showExplanation: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleHint: () => void;
  onToggleExplanation: () => void;
}

export default function Stepper({
  currentIndex,
  totalItems,
  showHint,
  showExplanation,
  onPrevious,
  onNext,
  onToggleHint,
  onToggleExplanation
}: StepperProps) {
  const atFirst = currentIndex === 0;
  const atLast = currentIndex === totalItems - 1;

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={atFirst}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={atLast}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
        <button
          type="button"
          onClick={onToggleHint}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {showHint ? "Hide Hint" : "Show Hint"}
        </button>
        <button
          type="button"
          onClick={onToggleExplanation}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {showExplanation ? "Hide Explanation" : "Show Explanation"}
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-700">
        Item {currentIndex + 1} of {totalItems}
      </p>
    </div>
  );
}
