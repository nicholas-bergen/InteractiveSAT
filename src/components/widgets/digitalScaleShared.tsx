import { SVGProps } from "react";

import { ScaleShapeGroup, ScaleWeightGroup } from "@/lib/types";

export interface FlattenedScaleShape {
  type: "circle" | "square" | "triangle";
  label: string;
  fill: string;
}

export interface FlattenedScaleWeight {
  label: string;
  fill: string;
}

export interface DigitalScaleLayout {
  shapeSize: number;
  groundY: number;
  shapeCenters: number[];
  weightCenters: number[];
  weightWidths: number[];
}

export const DIGITAL_SCALE_VIEWBOX_WIDTH = 420;
export const DIGITAL_SCALE_VIEWBOX_HEIGHT = 240;
export const DIGITAL_SCALE_PLATFORM_LEFT = 68;
export const DIGITAL_SCALE_PLATFORM_WIDTH = 284;
export const DIGITAL_SCALE_GROUND_Y = 102;
export const DIGITAL_SCALE_DISPLAY_X = 210;
export const DIGITAL_SCALE_DISPLAY_Y = 184;

function rowWidth(
  shapeCount: number,
  shapeSize: number,
  weightWidths: number[],
  itemGap: number,
  groupGap: number
): number {
  const shapeWidth = shapeCount * shapeSize;
  const weightWidth = weightWidths.reduce((sum, width) => sum + width, 0);
  const shapeInternalGaps = Math.max(0, shapeCount - 1) * itemGap;
  const weightInternalGaps = Math.max(0, weightWidths.length - 1) * itemGap;
  const middleGap = shapeCount > 0 && weightWidths.length > 0 ? groupGap : 0;
  return shapeWidth + weightWidth + shapeInternalGaps + weightInternalGaps + middleGap;
}

export function safeNumber(value: number): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function resolveDisplayText(scaleDisplayValue: number, scaleDisplayText: string | null | undefined): string {
  if (scaleDisplayText === null || scaleDisplayText === undefined) {
    return String(scaleDisplayValue);
  }

  return String(scaleDisplayText);
}

export function expandShapeGroups(shapeGroups: ScaleShapeGroup[]): FlattenedScaleShape[] {
  const flatShapes: FlattenedScaleShape[] = [];

  for (const group of shapeGroups) {
    const safeCount = Math.max(0, Number(group.count) || 0);
    const labels = group.labels ?? [];
    const fill = group.fill ?? "#bfeeb8";

    for (let index = 0; index < safeCount; index += 1) {
      flatShapes.push({
        type: group.type,
        label: labels[index] ?? "",
        fill
      });
    }
  }

  return flatShapes;
}

export function expandWeightGroups(weightGroups: ScaleWeightGroup[] = []): FlattenedScaleWeight[] {
  const flatWeights: FlattenedScaleWeight[] = [];

  for (const group of weightGroups) {
    const safeCount = Math.max(0, Number(group.count) || 0);
    const labels = group.labels ?? [];
    const fill = group.fill ?? "#667286";

    for (let index = 0; index < safeCount; index += 1) {
      flatWeights.push({
        label: labels[index] ?? "",
        fill
      });
    }
  }

  return flatWeights;
}

export function estimateWeightWidth(label: string, baseShapeSize: number): number {
  const charCount = Math.max(label.trim().length, 1);
  const minFromShape = baseShapeSize * 1.45;
  const preferredFont = 22;
  const minFromText = (charCount * preferredFont * 0.56 + 12) / 0.66;
  return Math.max(minFromShape, minFromText);
}

export function getWeightTextFontSize(label: string, weightWidth: number): number {
  const charCount = Math.max(label.trim().length, 1);
  const usableTextWidth = Math.max(weightWidth * 0.66 - 12, 6);
  const maxFromWidth = usableTextWidth / (charCount * 0.56);
  const maxFromHeight = weightWidth * 0.42;
  const preferredFont = 22;
  return Math.max(6, Math.min(preferredFont, maxFromWidth, maxFromHeight));
}

export function getShapeTextFontSize(label: string, shapeSize: number): number {
  const charCount = Math.max(label.trim().length, 1);
  const maxFromWidth = (shapeSize * 0.76) / (charCount * 0.58);
  const maxFromHeight = shapeSize * 0.56;
  const preferred = shapeSize * 0.52;
  return Math.max(10, Math.min(preferred, maxFromWidth, maxFromHeight));
}

export function getShapeTextStrokeWidth(shapeSize: number): number {
  return Math.max(1.2, shapeSize * 0.07);
}

export function computeDigitalScaleLayout(shapeCount: number, weightLabels: string[]): DigitalScaleLayout {
  const totalRenderedCount = Math.max(shapeCount + weightLabels.length, 1);
  const maxShapeSize = (DIGITAL_SCALE_PLATFORM_WIDTH - 16) / totalRenderedCount;
  let shapeSize = Math.min(34, maxShapeSize);
  let itemGap = 2;
  let groupGap = shapeCount > 0 && weightLabels.length > 0 ? 8 : 0;
  let weightWidths = weightLabels.map((label) => estimateWeightWidth(label, shapeSize));

  const maxRowWidth = DIGITAL_SCALE_PLATFORM_WIDTH - 8;
  const initialRowWidth = rowWidth(shapeCount, shapeSize, weightWidths, itemGap, groupGap);

  if (initialRowWidth > maxRowWidth && initialRowWidth > 0) {
    const compression = maxRowWidth / initialRowWidth;
    shapeSize *= compression;
    itemGap *= compression;
    groupGap *= compression;
    weightWidths = weightWidths.map((width) => width * compression);
  }

  const finalRowWidth = rowWidth(shapeCount, shapeSize, weightWidths, itemGap, groupGap);
  let cursorX = DIGITAL_SCALE_PLATFORM_LEFT + (DIGITAL_SCALE_PLATFORM_WIDTH - finalRowWidth) / 2;

  const shapeCenters: number[] = [];
  for (let index = 0; index < shapeCount; index += 1) {
    shapeCenters.push(cursorX + shapeSize / 2);
    cursorX += shapeSize;
    if (index < shapeCount - 1) {
      cursorX += itemGap;
    }
  }

  if (shapeCount > 0 && weightLabels.length > 0) {
    cursorX += groupGap;
  }

  const weightCenters: number[] = [];
  for (let index = 0; index < weightLabels.length; index += 1) {
    const width = weightWidths[index];
    weightCenters.push(cursorX + width / 2);
    cursorX += width;
    if (index < weightLabels.length - 1) {
      cursorX += itemGap;
    }
  }

  return {
    shapeSize,
    groundY: DIGITAL_SCALE_GROUND_Y,
    shapeCenters,
    weightCenters,
    weightWidths
  };
}

interface DigitalScaleChassisProps {
  plateGradientId: string;
  bodyGradientId: string;
  displayText: string;
}

export function DigitalScaleChassis({ plateGradientId, bodyGradientId, displayText }: DigitalScaleChassisProps) {
  return (
    <>
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
      <text
        x={DIGITAL_SCALE_DISPLAY_X}
        y={DIGITAL_SCALE_DISPLAY_Y}
        textAnchor="middle"
        fontSize="28"
        fontWeight="800"
        fill="#4f5968"
        letterSpacing="1"
      >
        {displayText}
      </text>
    </>
  );
}

export function renderScaleShape(shape: FlattenedScaleShape, index: number, centerX: number, shapeSize: number, groundY: number) {
  const stroke = "#8ebc88";
  const label = shape.label.trim();
  const labelFontSize = getShapeTextFontSize(label, shapeSize);
  const labelStrokeWidth = getShapeTextStrokeWidth(shapeSize);

  if (shape.type === "square") {
    const x = centerX - shapeSize / 2;
    const y = groundY - shapeSize;
    return (
      <g key={`shape-${index}`}>
        <rect
          x={x}
          y={y}
          width={shapeSize}
          height={shapeSize}
          rx={Math.max(4, shapeSize * 0.18)}
          fill={shape.fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {label ? (
          <text
            x={centerX}
            y={y + shapeSize / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={labelFontSize}
            fontWeight="800"
            fill="#17361f"
            stroke="#f7fbf7"
            strokeWidth={labelStrokeWidth}
            paintOrder="stroke"
          >
            {label}
          </text>
        ) : null}
      </g>
    );
  }

  if (shape.type === "triangle") {
    const half = shapeSize / 2;
    const topY = groundY - shapeSize;
    const points = `${centerX},${topY} ${centerX - half},${groundY} ${centerX + half},${groundY}`;

    return (
      <g key={`shape-${index}`}>
        <polygon points={points} fill={shape.fill} stroke={stroke} strokeWidth="1.5" />
        {label ? (
          <text
            x={centerX}
            y={groundY - shapeSize * 0.36}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={labelFontSize}
            fontWeight="800"
            fill="#17361f"
            stroke="#f7fbf7"
            strokeWidth={labelStrokeWidth}
            paintOrder="stroke"
          >
            {label}
          </text>
        ) : null}
      </g>
    );
  }

  const centerY = groundY - shapeSize / 2;
  return (
    <g key={`shape-${index}`}>
      <circle cx={centerX} cy={centerY} r={shapeSize / 2} fill={shape.fill} stroke={stroke} strokeWidth="1.5" />
      {label ? (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={labelFontSize}
          fontWeight="800"
          fill="#17361f"
          stroke="#f7fbf7"
          strokeWidth={labelStrokeWidth}
          paintOrder="stroke"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

interface DigitalScaleWeightGlyphProps extends SVGProps<SVGGElement> {
  centerX: number;
  centerY: number;
  width: number;
  fill: string;
  label: string;
}

export function DigitalScaleWeightGlyph({
  centerX,
  centerY,
  width,
  fill,
  label,
  ...groupProps
}: DigitalScaleWeightGlyphProps) {
  const scale = width / 100;
  const x = centerX - width / 2;
  const y = centerY - width * 0.6;
  const groundY = centerY + width * 0.6;
  const textFontSize = getWeightTextFontSize(label, width);
  const textY = groundY - width * 0.24;

  return (
    <g {...groupProps}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <circle cx="50" cy="20" r="16" fill="none" stroke={fill} strokeWidth="10" />
        <rect x="33" y="36" width="34" height="16" rx="6" fill={fill} />
        <polygon points="24,52 76,52 95,120 5,120" fill={fill} />
        <polygon points="24,52 76,52 72,56 28,56" fill="#758198" />
        <polygon points="25,58 31,58 26,74 19,74" fill="#edefef" />
        <rect x="18" y="77" width="4" height="4" fill="#edefef" />
      </g>

      {label ? (
        <text x={centerX} y={textY} textAnchor="middle" fontSize={textFontSize} fontWeight="700" fill="#f8fafc" pointerEvents="none">
          {label}
        </text>
      ) : null}
    </g>
  );
}
