import { BalanceState } from "@/lib/types";

interface BalanceScaleWidgetProps {
  leftMass: number;
  rightMass: number;
  value: BalanceState | null;
  onChange: (value: BalanceState) => void;
}

function getBeamRotation(value: BalanceState | null): number {
  if (value === "left_heavier") {
    return -8;
  }

  if (value === "right_heavier") {
    return 8;
  }

  return 0;
}

// This is intentionally plain SVG so widgets stay framework-light.
export default function BalanceScaleWidget({ leftMass, rightMass, value, onChange }: BalanceScaleWidgetProps) {
  const beamRotation = getBeamRotation(value);

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 300 200" className="w-full rounded-lg border border-slate-200 bg-white p-2" role="img">
        <title>Balance scale widget</title>
        <polygon points="150,65 130,110 170,110" fill="#475569" />
        <g transform={`rotate(${beamRotation} 150 65)`}>
          <line x1="70" y1="65" x2="230" y2="65" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />

          <line x1="90" y1="65" x2="90" y2="115" stroke="#475569" strokeWidth="3" />
          <line x1="210" y1="65" x2="210" y2="115" stroke="#475569" strokeWidth="3" />

          <ellipse cx="90" cy="125" rx="32" ry="10" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" />
          <ellipse cx="210" cy="125" rx="32" ry="10" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" />

          <text x="90" y="130" textAnchor="middle" className="fill-slate-700 text-[10px]">
            {leftMass}
          </text>
          <text x="210" y="130" textAnchor="middle" className="fill-slate-700 text-[10px]">
            {rightMass}
          </text>
        </g>
      </svg>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("left_heavier")}
          aria-pressed={value === "left_heavier"}
          className={`rounded-md border px-3 py-2 text-sm ${
            value === "left_heavier" ? "border-brand-700 bg-brand-50 text-brand-700" : "border-slate-300"
          }`}
        >
          Left heavier
        </button>
        <button
          type="button"
          onClick={() => onChange("balanced")}
          aria-pressed={value === "balanced"}
          className={`rounded-md border px-3 py-2 text-sm ${
            value === "balanced" ? "border-brand-700 bg-brand-50 text-brand-700" : "border-slate-300"
          }`}
        >
          Balanced
        </button>
        <button
          type="button"
          onClick={() => onChange("right_heavier")}
          aria-pressed={value === "right_heavier"}
          className={`rounded-md border px-3 py-2 text-sm ${
            value === "right_heavier" ? "border-brand-700 bg-brand-50 text-brand-700" : "border-slate-300"
          }`}
        >
          Right heavier
        </button>
      </div>
    </div>
  );
}
