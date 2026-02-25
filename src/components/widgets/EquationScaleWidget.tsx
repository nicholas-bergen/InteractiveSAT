"use client";

import {
  forwardRef,
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import katex from "katex";

import { EquationScaleConfig } from "@/lib/types";
import {
  computeDigitalScaleLayout,
  DigitalScaleChassis,
  DigitalScaleWeightGlyph,
  DIGITAL_SCALE_GROUND_Y,
  DIGITAL_SCALE_VIEWBOX_WIDTH,
  expandShapeGroups,
  FlattenedScaleShape,
  renderScaleShape,
  safeNumber
} from "@/components/widgets/digitalScaleShared";

interface EquationScaleWidgetProps {
  config: EquationScaleConfig;
  onCheckEnabledChange?: (isEnabled: boolean) => void;
}

export interface EquationScaleWidgetHandle {
  check: () => { isCorrect: boolean } | null;
}

interface Point {
  x: number;
  y: number;
}

interface FlattenedWeight {
  id: string;
  label: string;
  value: number;
  fill: string;
  removable: boolean;
}

interface DragState {
  weightId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  center: Point;
  hasMoved: boolean;
}

interface WorkspaceRow {
  id: string;
  order: number;
  kind: "equation" | "operation";
  left: string;
  right: string;
}

interface AnimatedWorkspaceRow extends WorkspaceRow {
  phase: "enter" | "visible" | "exit";
}

const VIEWBOX_HEIGHT = 300;
const DEFAULT_OFF_SCALE_X_OFFSET = -118;
const DEFAULT_OFF_SCALE_Y = DIGITAL_SCALE_GROUND_Y + 168;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  const fixed = value.toFixed(4).replace(/\.?0+$/, "");
  return fixed.length === 0 ? "0" : fixed;
}

function parseNumericLabel(label: string): number | null {
  const trimmed = label.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return null;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildSymbolTerms(shapeLabels: string[]): string[] {
  const countByLabel = new Map<string, number>();
  const order: string[] = [];

  for (const label of shapeLabels) {
    const currentCount = countByLabel.get(label) ?? 0;
    countByLabel.set(label, currentCount + 1);
    if (currentCount === 0) {
      order.push(label);
    }
  }

  return order.map((label) => {
    const count = countByLabel.get(label) ?? 1;
    return count === 1 ? label : `${count}${label}`;
  });
}

function renderKatexInline(value: string): string {
  return katex.renderToString(value, { displayMode: false, throwOnError: false });
}

function validateConfig(
  config: EquationScaleConfig,
  shapes: FlattenedScaleShape[],
  weights: FlattenedWeight[]
): string[] {
  const issues: string[] = [];

  const shapeLabels = shapes.map((shape) => shape.label.trim());
  const hasAnyShapeLabel = shapeLabels.some((label) => label.length > 0);
  const hasAnyBlankShapeLabel = shapeLabels.some((label) => label.length === 0);
  if (hasAnyShapeLabel && hasAnyBlankShapeLabel) {
    issues.push("Invalid shape labels: either label every shape or label none of them.");
  }

  if (weights.length === 0) {
    issues.push("At least one weight is required.");
  }

  const seenWeightIds = new Set<string>();
  let removableCount = 0;
  for (const weight of weights) {
    if (!weight.id.trim()) {
      issues.push("Each weight must include a non-empty id.");
    }

    if (seenWeightIds.has(weight.id)) {
      issues.push(`Duplicate weight id detected: ${weight.id}.`);
    } else {
      seenWeightIds.add(weight.id);
    }

    if (!Number.isFinite(weight.value)) {
      issues.push(`Weight "${weight.id}" must have a numeric label.`);
    }

    if (weight.removable) {
      removableCount += 1;
    }
  }

  if (removableCount === 0) {
    issues.push("At least one removable weight is required.");
  }

  const requiredIds = config.requiredRemovedWeightIds ?? weights.filter((weight) => weight.removable).map((weight) => weight.id);
  for (const requiredId of requiredIds) {
    const weight = weights.find((candidate) => candidate.id === requiredId);
    if (!weight) {
      issues.push(`requiredRemovedWeightIds references unknown weight id "${requiredId}".`);
      continue;
    }

    if (!weight.removable) {
      issues.push(`requiredRemovedWeightIds includes non-removable weight "${requiredId}".`);
    }
  }

  return issues;
}

function inlineRendered(value: string, className: string) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderKatexInline(value) }} />;
}

function baseDisplayText(config: EquationScaleConfig): string {
  const safeValue = safeNumber(config.scaleDisplayValue);
  if (config.scaleDisplayText === undefined || config.scaleDisplayText === null) {
    return formatNumber(safeValue);
  }

  return String(config.scaleDisplayText);
}

const EquationScaleWidget = forwardRef<EquationScaleWidgetHandle, EquationScaleWidgetProps>(function EquationScaleWidget(
  { config, onCheckEnabledChange },
  ref
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const exitTimeoutIdsRef = useRef<Record<string, number>>({});
  const gradientIdSeed = useId().replace(/:/g, "-");
  const plateGradientId = `equation-scale-plate-${gradientIdSeed}`;
  const bodyGradientId = `equation-scale-body-${gradientIdSeed}`;

  const safeScaleDisplayValue = safeNumber(config.scaleDisplayValue);
  const shapes = useMemo(() => expandShapeGroups(config.shapeGroups), [config.shapeGroups]);
  const weights = useMemo<FlattenedWeight[]>(() => {
    return config.weights.map((weight) => {
      const numeric = parseNumericLabel(weight.label);
      return {
        id: weight.id,
        label: weight.label.trim(),
        value: numeric ?? Number.NaN,
        fill: weight.fill ?? "#667286",
        removable: weight.removable !== false
      };
    });
  }, [config.weights]);

  const validationIssues = useMemo(() => validateConfig(config, shapes, weights), [config, shapes, weights]);
  const isValidConfig = validationIssues.length === 0;
  const shapeLabels = useMemo(() => shapes.map((shape) => shape.label.trim()), [shapes]);
  const usesExplicitShapeLabels = useMemo(() => shapeLabels.some((label) => label.length > 0), [shapeLabels]);
  const simplifiedShapeTerms = useMemo(() => {
    if (shapes.length === 0) {
      return [] as string[];
    }

    const resolvedLabels = usesExplicitShapeLabels ? shapeLabels : shapes.map(() => "x");
    return buildSymbolTerms(resolvedLabels);
  }, [shapeLabels, shapes, usesExplicitShapeLabels]);

  const requiredRemovedWeightIds = useMemo(() => {
    if (config.requiredRemovedWeightIds) {
      return config.requiredRemovedWeightIds;
    }

    return weights.filter((weight) => weight.removable).map((weight) => weight.id);
  }, [config.requiredRemovedWeightIds, weights]);

  const [weightOnScale, setWeightOnScale] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const weight of weights) {
      initial[weight.id] = true;
    }
    return initial;
  });
  const [removedOrder, setRemovedOrder] = useState<string[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hasMovedOffScale, setHasMovedOffScale] = useState(false);
  const [animatedRows, setAnimatedRows] = useState<AnimatedWorkspaceRow[]>([]);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const weight of weights) {
      initial[weight.id] = true;
    }

    setWeightOnScale(initial);
    setRemovedOrder([]);
    setDragState(null);
    setHasMovedOffScale(false);
    setAnimatedRows([]);
  }, [weights]);

  useEffect(() => {
    onCheckEnabledChange?.(hasMovedOffScale && isValidConfig);
  }, [hasMovedOffScale, isValidConfig, onCheckEnabledChange]);

  useEffect(() => {
    if (validationIssues.length === 0) {
      return;
    }

    console.error("Invalid equationScale config:", validationIssues);
  }, [validationIssues]);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(exitTimeoutIdsRef.current)) {
        window.clearTimeout(timeoutId);
      }
      exitTimeoutIdsRef.current = {};
    };
  }, []);

  const weightOrderById = useMemo(() => {
    const byId: Record<string, number> = {};
    weights.forEach((weight, index) => {
      byId[weight.id] = index;
    });
    return byId;
  }, [weights]);

  const weightById = useMemo(() => {
    const byId: Record<string, FlattenedWeight> = {};
    for (const weight of weights) {
      byId[weight.id] = weight;
    }
    return byId;
  }, [weights]);

  const layout = useMemo(
    () =>
      computeDigitalScaleLayout(
        shapes.length,
        weights.map((weight) => weight.label)
      ),
    [shapes.length, weights]
  );

  const onScaleCentersById = useMemo(() => {
    const centers: Record<string, Point> = {};
    for (let index = 0; index < weights.length; index += 1) {
      const weight = weights[index];
      centers[weight.id] = {
        x: layout.weightCenters[index],
        y: layout.groundY - layout.weightWidths[index] * 0.6
      };
    }
    return centers;
  }, [layout.groundY, layout.weightCenters, layout.weightWidths, weights]);

  const offScaleCentersById = useMemo(() => {
    const centers: Record<string, Point> = {};
    for (let index = 0; index < weights.length; index += 1) {
      const weight = weights[index];
      centers[weight.id] = {
        x: clamp(layout.weightCenters[index] + DEFAULT_OFF_SCALE_X_OFFSET, 14, DIGITAL_SCALE_VIEWBOX_WIDTH - 28),
        y: DEFAULT_OFF_SCALE_Y
      };
    }
    return centers;
  }, [layout.weightCenters, weights]);

  function toSvgPoint(clientX: number, clientY: number): Point | null {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }

    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * DIGITAL_SCALE_VIEWBOX_WIDTH,
      y: ((clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT
    };
  }

  function updateWeightPlacement(weightId: string, shouldBeOnScale: boolean): void {
    const weight = weightById[weightId];
    if (!weight || !weight.removable) {
      return;
    }

    setWeightOnScale((previous) => {
      if (previous[weightId] === shouldBeOnScale) {
        return previous;
      }
      return { ...previous, [weightId]: shouldBeOnScale };
    });

    if (shouldBeOnScale) {
      setRemovedOrder((previous) => previous.filter((id) => id !== weightId));
      return;
    }

    setHasMovedOffScale(true);
    setRemovedOrder((previous) => {
      const withoutCurrent = previous.filter((id) => id !== weightId);
      return [...withoutCurrent, weightId];
    });
  }

  function currentWeightCenter(weightId: string): Point | null {
    const weight = weightById[weightId];
    if (!weight) {
      return null;
    }

    if (!weight.removable) {
      return onScaleCentersById[weightId] ?? null;
    }

    return weightOnScale[weightId] ? onScaleCentersById[weightId] ?? null : offScaleCentersById[weightId] ?? null;
  }

  function handleWeightPointerDown(event: PointerEvent<SVGGElement>, weightId: string): void {
    const weight = weightById[weightId];
    if (!weight || !weight.removable) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const center = currentWeightCenter(weightId);
    const point = toSvgPoint(event.clientX, event.clientY);
    if (!center || !point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      weightId,
      pointerId: event.pointerId,
      offsetX: point.x - center.x,
      offsetY: point.y - center.y,
      center,
      hasMoved: false
    });
  }

  function handleWeightPointerMove(event: PointerEvent<SVGGElement>, weightId: string): void {
    setDragState((current) => {
      if (!current || current.weightId !== weightId || current.pointerId !== event.pointerId) {
        return current;
      }

      const point = toSvgPoint(event.clientX, event.clientY);
      if (!point) {
        return current;
      }

      const nextCenter = {
        x: point.x - current.offsetX,
        y: point.y - current.offsetY
      };

      const movement = Math.hypot(nextCenter.x - current.center.x, nextCenter.y - current.center.y);
      return {
        ...current,
        center: nextCenter,
        hasMoved: current.hasMoved || movement > 4
      };
    });
  }

  function handleWeightPointerUp(event: PointerEvent<SVGGElement>, weightId: string): void {
    const currentDrag = dragState;
    if (!currentDrag || currentDrag.weightId !== weightId || currentDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const point = toSvgPoint(event.clientX, event.clientY);
    const releasedCenter = point
      ? {
          x: point.x - currentDrag.offsetX,
          y: point.y - currentDrag.offsetY
        }
      : currentDrag.center;

    setDragState(null);

    if (!currentDrag.hasMoved) {
      return;
    }

    const width = layout.weightWidths[weightOrderById[weightId]] ?? 0;
    const bottomY = releasedCenter.y + width * 0.6;
    const threshold = Number.isFinite(config.snapBackThreshold) ? Math.max(8, Number(config.snapBackThreshold)) : 36;
    const shouldBeOnScale = Math.abs(bottomY - DIGITAL_SCALE_GROUND_Y) <= threshold || bottomY < DIGITAL_SCALE_GROUND_Y;
    updateWeightPlacement(weightId, shouldBeOnScale);
  }

  function handleWeightPointerCancel(event: PointerEvent<SVGGElement>, weightId: string): void {
    if (!dragState || dragState.weightId !== weightId || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  }

  function handleWeightKeyDown(event: KeyboardEvent<SVGGElement>, weightId: string): void {
    const weight = weightById[weightId];
    if (!weight || !weight.removable) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
      return;
    }

    event.preventDefault();
    updateWeightPlacement(weightId, !weightOnScale[weightId]);
  }

  const removedWeightIdsInOrder = useMemo(
    () =>
      removedOrder.filter((weightId) => {
        const weight = weightById[weightId];
        return Boolean(weight && weight.removable && !weightOnScale[weightId]);
      }),
    [removedOrder, weightById, weightOnScale]
  );

  const removedWeightSum = useMemo(() => {
    let sum = 0;
    for (const weightId of removedWeightIdsInOrder) {
      const weight = weightById[weightId];
      if (!weight) {
        continue;
      }
      sum += weight.value;
    }
    return sum;
  }, [removedWeightIdsInOrder, weightById]);

  const displayText = useMemo(() => {
    if (removedWeightIdsInOrder.length === 0) {
      return baseDisplayText(config);
    }
    return formatNumber(safeScaleDisplayValue - removedWeightSum);
  }, [config, removedWeightIdsInOrder.length, removedWeightSum, safeScaleDisplayValue]);

  const visibleRows = useMemo(() => {
    const rows: WorkspaceRow[] = [];
    const activeWeightIds = new Set(weights.map((weight) => weight.id));
    let rightValue = safeScaleDisplayValue;

    const leftSideFor = (onScaleWeightIds: Set<string>): string => {
      const weightTerms = weights
        .filter((weight) => onScaleWeightIds.has(weight.id))
        .map((weight) => formatNumber(weight.value));
      const allTerms = [...simplifiedShapeTerms, ...weightTerms];
      return allTerms.length > 0 ? allTerms.join(" + ") : "0";
    };

    rows.push({
      id: "equation-base",
      order: 0,
      kind: "equation",
      left: leftSideFor(activeWeightIds),
      right: formatNumber(rightValue)
    });

    removedWeightIdsInOrder.forEach((weightId, index) => {
      const weight = weightById[weightId];
      if (!weight) {
        return;
      }

      rows.push({
        id: `operation-${weightId}`,
        order: index * 2 + 1,
        kind: "operation",
        left: `-${formatNumber(weight.value)}`,
        right: `-${formatNumber(weight.value)}`
      });

      activeWeightIds.delete(weightId);
      rightValue -= weight.value;
      rows.push({
        id: `equation-step-${index + 1}`,
        order: index * 2 + 2,
        kind: "equation",
        left: leftSideFor(activeWeightIds),
        right: formatNumber(rightValue)
      });
    });

    return rows;
  }, [removedWeightIdsInOrder, safeScaleDisplayValue, simplifiedShapeTerms, weightById, weights]);

  useEffect(() => {
    setAnimatedRows((previous) => {
      const previousById = new Map(previous.map((row) => [row.id, row]));
      const visibleById = new Map(visibleRows.map((row) => [row.id, row]));
      const nextRows: AnimatedWorkspaceRow[] = [];

      for (const row of visibleRows) {
        const existing = previousById.get(row.id);
        nextRows.push({
          ...row,
          phase: existing ? (existing.phase === "exit" ? "enter" : existing.phase) : "enter"
        });
      }

      for (const row of previous) {
        if (visibleById.has(row.id)) {
          continue;
        }

        nextRows.push({
          ...row,
          phase: "exit"
        });
      }

      nextRows.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
      return nextRows;
    });
  }, [visibleRows]);

  useEffect(() => {
    if (animatedRows.every((row) => row.phase !== "enter")) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      setAnimatedRows((previous) =>
        previous.map((row) =>
          row.phase === "enter"
            ? {
                ...row,
                phase: "visible"
              }
            : row
        )
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [animatedRows]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const exitingIds = animatedRows.filter((row) => row.phase === "exit").map((row) => row.id);
    const exitingSet = new Set(exitingIds);

    for (const exitingId of exitingIds) {
      if (exitTimeoutIdsRef.current[exitingId]) {
        continue;
      }

      exitTimeoutIdsRef.current[exitingId] = window.setTimeout(() => {
        setAnimatedRows((previous) => previous.filter((row) => row.id !== exitingId));
        const timeoutId = exitTimeoutIdsRef.current[exitingId];
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          delete exitTimeoutIdsRef.current[exitingId];
        }
      }, 280);
    }

    for (const [id, timeoutId] of Object.entries(exitTimeoutIdsRef.current)) {
      if (exitingSet.has(id)) {
        continue;
      }
      window.clearTimeout(timeoutId);
      delete exitTimeoutIdsRef.current[id];
    }
  }, [animatedRows]);

  const checkInternal = useCallback((): { isCorrect: boolean } | null => {
    if (!isValidConfig) {
      return null;
    }

    const isCorrect = requiredRemovedWeightIds.every((weightId) => {
      const weight = weightById[weightId];
      return Boolean(weight?.removable && !weightOnScale[weightId]);
    });

    return { isCorrect };
  }, [isValidConfig, requiredRemovedWeightIds, weightById, weightOnScale]);

  useImperativeHandle(
    ref,
    () => ({
      check: checkInternal
    }),
    [checkInternal]
  );

  if (!isValidConfig) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold text-red-800">Invalid equation scale configuration.</p>
        <ul className="mt-2 list-disc pl-5">
          {validationIssues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </div>
    );
  }

  const maxWidth = Number.isFinite(config.layout?.maxWidth) ? clamp(Number(config.layout?.maxWidth), 320, 980) : 900;

  return (
    <div className="w-full" style={{ maxWidth }}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)] lg:items-start">
        <div className="px-1 sm:px-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${DIGITAL_SCALE_VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            width="100%"
            style={{ height: "auto" }}
            role="img"
            aria-label="Digital scale"
          >
            <DigitalScaleChassis plateGradientId={plateGradientId} bodyGradientId={bodyGradientId} displayText={displayText} />

            {shapes.map((shape, index) => renderScaleShape(shape, index, layout.shapeCenters[index], layout.shapeSize, layout.groundY))}

            {weights.map((weight, index) => {
              const width = layout.weightWidths[index];
              const isDragging = dragState?.weightId === weight.id;
              const targetCenter = isDragging
                ? dragState?.center
                : weight.removable && !weightOnScale[weight.id]
                  ? offScaleCentersById[weight.id]
                  : onScaleCentersById[weight.id];
              if (!targetCenter) {
                return null;
              }

              const isOffScale = weight.removable && !weightOnScale[weight.id];
              const isInteractive = weight.removable;

              return (
                <DigitalScaleWeightGlyph
                  key={weight.id}
                  centerX={targetCenter.x}
                  centerY={targetCenter.y}
                  width={width}
                  fill={weight.fill}
                  label={weight.label}
                  role={isInteractive ? "button" : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  aria-label={isInteractive ? `Weight ${weight.label}` : undefined}
                  onPointerDown={isInteractive ? (event) => handleWeightPointerDown(event, weight.id) : undefined}
                  onPointerMove={isInteractive ? (event) => handleWeightPointerMove(event, weight.id) : undefined}
                  onPointerUp={isInteractive ? (event) => handleWeightPointerUp(event, weight.id) : undefined}
                  onPointerCancel={isInteractive ? (event) => handleWeightPointerCancel(event, weight.id) : undefined}
                  onKeyDown={isInteractive ? (event) => handleWeightKeyDown(event, weight.id) : undefined}
                  className={isInteractive ? "cursor-grab focus:outline-none" : undefined}
                  style={{
                    transition: isDragging ? "none" : "transform 220ms ease, opacity 220ms ease",
                    opacity: isOffScale ? 0.92 : 1
                  }}
                />
              );
            })}
          </svg>
        </div>

        <div className="px-1 pt-8 sm:px-2 sm:pt-10">
          <div className="space-y-2">
            {animatedRows.map((row) => {
              const visibilityClass =
                row.phase === "visible"
                  ? "max-h-14 translate-y-0 opacity-100"
                  : row.phase === "enter"
                    ? "max-h-0 translate-y-1 opacity-0"
                    : "max-h-0 -translate-y-1 opacity-0";

              const valueClass = row.kind === "operation" ? "text-slate-500" : "text-slate-900";

              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 overflow-hidden transition-all duration-300 ease-out ${visibilityClass}`}
                >
                  <div className="justify-self-end">
                    {inlineRendered(row.left, `text-2xl leading-8 sm:text-3xl sm:leading-9 ${valueClass}`)}
                  </div>
                  <div className="min-w-[1.25rem] text-center">
                    {row.kind === "equation"
                      ? inlineRendered("=", "text-2xl leading-8 text-slate-900 sm:text-3xl sm:leading-9")
                      : inlineRendered("\\;", "text-2xl leading-8 text-slate-400 sm:text-3xl sm:leading-9")}
                  </div>
                  <div className="justify-self-start">
                    {inlineRendered(row.right, `text-2xl leading-8 sm:text-3xl sm:leading-9 ${valueClass}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

EquationScaleWidget.displayName = "EquationScaleWidget";

export default EquationScaleWidget;
