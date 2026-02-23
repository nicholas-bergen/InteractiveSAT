"use client";

import { useId } from "react";

import { ScaleShapeGroup, ScaleWeightGroup, SingleDigitalScaleConfig } from "@/lib/types";

interface SingleDigitalScaleWidgetProps {
  config: SingleDigitalScaleConfig;
}

interface FlattenedShape {
  type: "circle" | "square" | "triangle";
  label: string;
  fill: string;
}

interface FlattenedWeight {
  label: string;
  fill: string;
}

function expandShapeGroups(shapeGroups: ScaleShapeGroup[]): FlattenedShape[] {
  const flatShapes: FlattenedShape[] = [];

  for (const group of shapeGroups) {
    const safeCount = Math.max(0, Number(group.count) || 0);
    const labels = group.labels ?? [];
    const fill = group.fill ?? "#bfeeb8";

    for (let i = 0; i < safeCount; i += 1) {
      flatShapes.push({
        type: group.type,
        label: labels[i] ?? "",
        fill
      });
    }
  }

  return flatShapes;
}

function expandWeightGroups(weightGroups: ScaleWeightGroup[] = []): FlattenedWeight[] {
  const flatWeights: FlattenedWeight[] = [];

  for (const group of weightGroups) {
    const safeCount = Math.max(0, Number(group.count) || 0);
    const labels = group.labels ?? [];
    const fill = group.fill ?? "#667286";

    for (let i = 0; i < safeCount; i += 1) {
      flatWeights.push({
        label: labels[i] ?? "",
        fill
      });
    }
  }

  return flatWeights;
}

function safeNumber(value: number): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function resolveDisplayText(scaleDisplayValue: number, scaleDisplayText: string | null): string {
  if (scaleDisplayText === null) {
    return String(scaleDisplayValue);
  }

  return String(scaleDisplayText);
}

function getWeightTextFontSize(label: string): number {
  const charCount = Math.max(label.trim().length, 1);
  const maxTextWidth = 34;
  const baseFont = 22;
  return Math.max(12, Math.min(baseFont, maxTextWidth / (charCount * 0.56)));
}

function estimateWeightWidth(label: string, baseShapeSize: number): number {
  const charCount = Math.max(label.trim().length, 1);
  const minFromShape = baseShapeSize * 1.35;
  const minFromText = 30 + charCount * 11;
  return Math.max(minFromShape, minFromText);
}

function renderWeight(weight: FlattenedWeight, cx: number, groundY: number, width: number, index: number) {
  const scale = width / 100;
  const bodyBottomY = 120;
  const x = cx - width / 2;
  // Align the weight base directly on the scale plate edge (no floating gap).
  const y = groundY - bodyBottomY * scale;
  const fill = weight.fill;
  const textFontSize = getWeightTextFontSize(weight.label);

  // SVG silhouette based on the provided mock-up: ring + cap + trapezoid body + label.
  return (
    <g key={`weight-${index}`} transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="50" cy="20" r="16" fill="none" stroke={fill} strokeWidth="10" />
      <rect x="33" y="36" width="34" height="16" rx="6" fill={fill} />
      <polygon points="24,52 76,52 95,120 5,120" fill={fill} />
      <polygon points="24,52 76,52 72,56 28,56" fill="#758198" />
      <polygon points="25,58 31,58 26,74 19,74" fill="#edefef" />
      <rect x="18" y="77" width="4" height="4" fill="#edefef" />
      {weight.label ? (
        <text x="50" y="95" textAnchor="middle" fontSize={textFontSize} fontWeight="700" fill="#f8fafc">
          {weight.label}
        </text>
      ) : null}
    </g>
  );
}

// Static visual widget: this does not do answer selection or grading.
export default function SingleDigitalScaleWidget({ config }: SingleDigitalScaleWidgetProps) {
  const gradientIdSeed = useId().replace(/:/g, "-");
  const plateGradientId = `metal-plate-${gradientIdSeed}`;
  const bodyGradientId = `metal-body-${gradientIdSeed}`;

  const safeScaleValue = safeNumber(config.scaleDisplayValue);
  const displayText = resolveDisplayText(safeScaleValue, config.scaleDisplayText);
  const shapes = expandShapeGroups(config.shapeGroups);
  const weights = expandWeightGroups(config.weightGroups ?? []);

  const maxWidth = Number.isFinite(config.layout.maxWidth) ? Math.max(220, config.layout.maxWidth) : 420;
  const totalRenderedCount = Math.max(shapes.length + weights.length, 1);

  // Matches Observable scale spacing so content layout stays predictable.
  const platformLeft = 68;
  const platformWidth = 284;
  const maxShapeSize = (platformWidth - 16) / totalRenderedCount;
  let shapeSize = Math.min(34, maxShapeSize);
  const groundY = 102;

  const shapePositions: number[] = [];
  const weightPositions: number[] = [];
  let itemGap = 2;
  let groupGap = shapes.length > 0 && weights.length > 0 ? 8 : 0;
  let weightWidths = weights.map((weight) => estimateWeightWidth(weight.label, shapeSize));

  function rowWidth(
    currentShapeSize: number,
    currentWeightWidths: number[],
    currentItemGap: number,
    currentGroupGap: number
  ): number {
    const shapeWidth = shapes.length * currentShapeSize;
    const weightWidth = currentWeightWidths.reduce((sum, width) => sum + width, 0);
    const shapeInternalGaps = Math.max(0, shapes.length - 1) * currentItemGap;
    const weightInternalGaps = Math.max(0, currentWeightWidths.length - 1) * currentItemGap;
    const middleGap = shapes.length > 0 && currentWeightWidths.length > 0 ? currentGroupGap : 0;
    return shapeWidth + weightWidth + shapeInternalGaps + weightInternalGaps + middleGap;
  }

  const maxRowWidth = platformWidth - 8;
  const initialRowWidth = rowWidth(shapeSize, weightWidths, itemGap, groupGap);

  if (initialRowWidth > maxRowWidth && initialRowWidth > 0) {
    const compression = maxRowWidth / initialRowWidth;
    shapeSize *= compression;
    itemGap *= compression;
    groupGap *= compression;
    weightWidths = weightWidths.map((width) => width * compression);
  }

  const finalRowWidth = rowWidth(shapeSize, weightWidths, itemGap, groupGap);
  let cursorX = platformLeft + (platformWidth - finalRowWidth) / 2;

  for (let i = 0; i < shapes.length; i += 1) {
    shapePositions.push(cursorX + shapeSize / 2);
    cursorX += shapeSize;
    if (i < shapes.length - 1) {
      cursorX += itemGap;
    }
  }

  if (shapes.length > 0 && weights.length > 0) {
    cursorX += groupGap;
  }

  for (let i = 0; i < weights.length; i += 1) {
    const currentWidth = weightWidths[i];
    weightPositions.push(cursorX + currentWidth / 2);
    cursorX += currentWidth;
    if (i < weights.length - 1) {
      cursorX += itemGap;
    }
  }

  return (
    <div className="mx-auto w-full" style={{ maxWidth }}>
      <svg
        viewBox="0 0 420 240"
        width="100%"
        style={{ height: "auto" }}
        role="img"
        aria-label="Single digital scale visualization"
      >
        <defs>
          <linearGradient id={plateGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f0f2f5" />
            <stop offset="100%" stopColor="#c8ced6" />
          </linearGradient>
          <linearGradient id={bodyGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d7dde5" />
            <stop offset="100%" stopColor="#b2bbc7" />
          </linearGradient>
        </defs>

        <rect x="52" y="102" width="316" height="18" rx="10" fill={`url(#${plateGradientId})`} stroke="#8f97a3" strokeWidth="2" />
        <rect x="88" y="118" width="244" height="14" rx="7" fill="#a9b1bc" stroke="#8f97a3" strokeWidth="1.6" />

        <path
          d="M90 132 L330 132 L347 194 Q347 206 334 206 L86 206 Q73 206 73 194 Z"
          fill={`url(#${bodyGradientId})`}
          stroke="#8a93a0"
          strokeWidth="2.2"
        />

        <rect x="145" y="154" width="130" height="42" rx="8" fill="#c4cbd6" stroke="#858f9d" strokeWidth="1.8" />
        <rect x="153" y="160" width="114" height="30" rx="6" fill="#edf1f6" stroke="#9ca6b2" strokeWidth="1.2" />
        <text x="210" y="181" textAnchor="middle" fontSize="28" fontWeight="800" fill="#4f5968" letterSpacing="1">
          {displayText}
        </text>

        {shapes.map((shape, index) => {
          const cx = shapePositions[index];
          const stroke = "#8ebc88";

          if (shape.type === "square") {
            const x = cx - shapeSize / 2;
            const y = groundY - shapeSize;

            return (
              <g key={`shape-${index}`}>
                <rect x={x} y={y} width={shapeSize} height={shapeSize} rx={Math.max(4, shapeSize * 0.18)} fill={shape.fill} stroke={stroke} strokeWidth="1.5" />
                {shape.label ? (
                  <text x={cx} y={y + shapeSize / 2 + 5} textAnchor="middle" fontSize={Math.max(8, shapeSize * 0.45)} fontWeight="700" fill="#2a5a2a">
                    {shape.label}
                  </text>
                ) : null}
              </g>
            );
          }

          if (shape.type === "triangle") {
            const half = shapeSize / 2;
            const topY = groundY - shapeSize;
            const points = `${cx},${topY} ${cx - half},${groundY} ${cx + half},${groundY}`;

            return (
              <g key={`shape-${index}`}>
                <polygon points={points} fill={shape.fill} stroke={stroke} strokeWidth="1.5" />
                {shape.label ? (
                  <text
                    x={cx}
                    y={groundY - shapeSize * 0.32}
                    textAnchor="middle"
                    fontSize={Math.max(8, shapeSize * 0.4)}
                    fontWeight="700"
                    fill="#2a5a2a"
                  >
                    {shape.label}
                  </text>
                ) : null}
              </g>
            );
          }

          const cy = groundY - shapeSize / 2;
          return (
            <g key={`shape-${index}`}>
              <circle cx={cx} cy={cy} r={shapeSize / 2} fill={shape.fill} stroke={stroke} strokeWidth="1.5" />
              {shape.label ? (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize={Math.max(8, shapeSize * 0.45)} fontWeight="700" fill="#2a5a2a">
                  {shape.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {weights.map((weight, index) => renderWeight(weight, weightPositions[index], groundY, weightWidths[index], index))}
      </svg>
    </div>
  );
}
