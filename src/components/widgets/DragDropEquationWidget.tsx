"use client";

import {
  forwardRef,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import katex from "katex";

import { DragDropEquationConfig, DragDropLineToken } from "@/lib/types";

type SlotFeedback = "correct" | "incorrect" | null;

interface Point {
  x: number;
  y: number;
}

interface PieceInstance {
  instanceId: string;
  pieceId: string;
  label: string;
  latex: boolean;
  homeIndex: number;
}

type PieceLocation = { kind: "home"; homeIndex: number } | { kind: "slot"; slotId: string };

interface DragState {
  pieceInstanceId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  center: Point;
  hasMoved: boolean;
}

interface MatchResult {
  isCorrect: boolean;
  slotCorrectness: Record<string, boolean>;
}

export interface DragDropEquationWidgetHandle {
  check: () => { isCorrect: boolean } | null;
  retry: () => void;
  showAnswer: () => void;
}

interface DragDropEquationWidgetProps {
  config: DragDropEquationConfig;
  onFilledChange?: (isFilled: boolean) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safePositiveInteger(value: number | undefined): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }

  return Math.max(1, Math.floor(numeric));
}

function renderKatexInline(value: string): string {
  return katex.renderToString(value, { displayMode: false, throwOnError: false });
}

function collectSlotIds(tokens: DragDropLineToken[]): { slotIds: string[]; duplicateSlotIds: string[] } {
  const slotIds: string[] = [];
  const seen = new Set<string>();
  const duplicateSlotIds: string[] = [];

  for (const token of tokens) {
    if (token.kind !== "slot") {
      continue;
    }

    if (seen.has(token.slotId)) {
      duplicateSlotIds.push(token.slotId);
      continue;
    }

    seen.add(token.slotId);
    slotIds.push(token.slotId);
  }

  return { slotIds, duplicateSlotIds };
}

function buildPieceInstances(config: DragDropEquationConfig, defaultLatex: boolean): PieceInstance[] {
  const pieceInstances: PieceInstance[] = [];
  let homeIndex = 0;

  for (const piece of config.pieces) {
    const uses = safePositiveInteger(piece.uses);
    for (let copyIndex = 0; copyIndex < uses; copyIndex += 1) {
      const needsSuffix = uses > 1;
      const instanceId = needsSuffix ? `${piece.id}__${copyIndex + 1}` : piece.id;
      pieceInstances.push({
        instanceId,
        pieceId: piece.id,
        label: piece.label,
        latex: piece.latex ?? defaultLatex,
        homeIndex
      });
      homeIndex += 1;
    }
  }

  return pieceInstances;
}

function buildSlotOccupants(
  pieceLocations: Record<string, PieceLocation>,
  slotIds: string[]
): Record<string, string | null> {
  const occupants: Record<string, string | null> = {};
  for (const slotId of slotIds) {
    occupants[slotId] = null;
  }

  for (const [pieceInstanceId, location] of Object.entries(pieceLocations)) {
    if (location.kind !== "slot") {
      continue;
    }

    occupants[location.slotId] = pieceInstanceId;
  }

  return occupants;
}

function evaluateAssignments(
  slotAssignments: Record<string, string>,
  slotIds: string[],
  acceptedAnswers: Array<Record<string, string>>
): MatchResult {
  const fallback = acceptedAnswers[0] ?? {};
  let bestAnswer = fallback;
  let bestMatches = -1;
  let exactMatchFound = false;

  for (const answer of acceptedAnswers) {
    let matches = 0;
    let isExact = true;

    for (const slotId of slotIds) {
      const isMatch = slotAssignments[slotId] === answer[slotId];
      if (isMatch) {
        matches += 1;
      } else {
        isExact = false;
      }
    }

    if (isExact) {
      bestAnswer = answer;
      exactMatchFound = true;
      break;
    }

    if (matches > bestMatches) {
      bestMatches = matches;
      bestAnswer = answer;
    }
  }

  const slotCorrectness: Record<string, boolean> = {};
  for (const slotId of slotIds) {
    slotCorrectness[slotId] = slotAssignments[slotId] === bestAnswer[slotId];
  }

  return {
    isCorrect: exactMatchFound,
    slotCorrectness
  };
}

function validateConfig(
  config: DragDropEquationConfig,
  slotIds: string[],
  duplicateSlotIds: string[],
  pieceInstances: PieceInstance[]
): string[] {
  const issues: string[] = [];
  const uniquePieceIds = new Set<string>();
  const instanceCountByPieceId: Record<string, number> = {};

  if (config.tokens.length === 0) {
    issues.push("`tokens` cannot be empty.");
  }

  if (slotIds.length === 0) {
    issues.push("At least one slot token is required.");
  }

  if (duplicateSlotIds.length > 0) {
    const distinctDuplicateSlotIds = Array.from(new Set(duplicateSlotIds));
    issues.push(`Duplicate slot ids are not allowed: ${distinctDuplicateSlotIds.join(", ")}.`);
  }

  if (config.pieces.length === 0) {
    issues.push("At least one draggable piece is required.");
  }

  for (const piece of config.pieces) {
    if (!piece.id.trim()) {
      issues.push("Each piece must have a non-empty id.");
    }

    if (uniquePieceIds.has(piece.id)) {
      issues.push(`Duplicate piece id detected: ${piece.id}.`);
    } else {
      uniquePieceIds.add(piece.id);
    }

    if (safePositiveInteger(piece.uses) !== Number(piece.uses ?? 1)) {
      issues.push(`Piece \"${piece.id}\" has non-integer uses; uses must be a positive integer.`);
    }
  }

  for (const instance of pieceInstances) {
    instanceCountByPieceId[instance.pieceId] = (instanceCountByPieceId[instance.pieceId] ?? 0) + 1;
  }

  if (config.acceptedAnswers.length === 0) {
    issues.push("At least one accepted answer configuration is required.");
  }

  const slotIdSet = new Set(slotIds);
  config.acceptedAnswers.forEach((answer, answerIndex) => {
    const answerLabel = `acceptedAnswers[${answerIndex}]`;
    const answerSlotIds = Object.keys(answer);

    for (const slotId of slotIds) {
      if (!(slotId in answer)) {
        issues.push(`${answerLabel} is missing slot \"${slotId}\".`);
      }
    }

    for (const slotId of answerSlotIds) {
      if (!slotIdSet.has(slotId)) {
        issues.push(`${answerLabel} includes unknown slot \"${slotId}\".`);
      }
    }

    const requiredCountByPieceId: Record<string, number> = {};
    for (const pieceId of Object.values(answer)) {
      if (!uniquePieceIds.has(pieceId)) {
        issues.push(`${answerLabel} references unknown piece id \"${pieceId}\".`);
      }
      requiredCountByPieceId[pieceId] = (requiredCountByPieceId[pieceId] ?? 0) + 1;
    }

    for (const [pieceId, requiredCount] of Object.entries(requiredCountByPieceId)) {
      const availableCount = instanceCountByPieceId[pieceId] ?? 0;
      if (requiredCount > availableCount) {
        issues.push(
          `${answerLabel} uses piece \"${pieceId}\" ${requiredCount} time(s), but only ${availableCount} draggable copy/copies exist.`
        );
      }
    }
  });

  return issues;
}

function initialPieceLocations(pieceInstances: PieceInstance[]): Record<string, PieceLocation> {
  const locations: Record<string, PieceLocation> = {};
  for (const instance of pieceInstances) {
    locations[instance.instanceId] = { kind: "home", homeIndex: instance.homeIndex };
  }
  return locations;
}

function emptySlotFeedback(slotIds: string[]): Record<string, SlotFeedback> {
  const feedback: Record<string, SlotFeedback> = {};
  for (const slotId of slotIds) {
    feedback[slotId] = null;
  }
  return feedback;
}

function InlineExpression({ value, isLatex, className }: { value: string; isLatex: boolean; className?: string }) {
  const rendered = useMemo(() => (isLatex ? renderKatexInline(value) : value), [value, isLatex]);

  if (!isLatex) {
    return <span className={className}>{value}</span>;
  }

  return <span className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
}

const DragDropEquationWidget = forwardRef<DragDropEquationWidgetHandle, DragDropEquationWidgetProps>(
  function DragDropEquationWidget({ config, onFilledChange }, ref) {
    const defaultLatex = config.defaultLatex !== false;
    const { slotIds, duplicateSlotIds } = useMemo(() => collectSlotIds(config.tokens), [config.tokens]);
    const pieceInstances = useMemo(() => buildPieceInstances(config, defaultLatex), [config, defaultLatex]);
    const pieceByInstanceId = useMemo(() => {
      const byId: Record<string, PieceInstance> = {};
      for (const instance of pieceInstances) {
        byId[instance.instanceId] = instance;
      }
      return byId;
    }, [pieceInstances]);

    const validationIssues = useMemo(
      () => validateConfig(config, slotIds, duplicateSlotIds, pieceInstances),
      [config, slotIds, duplicateSlotIds, pieceInstances]
    );
    const isValidConfig = validationIssues.length === 0;

    const boardRef = useRef<HTMLDivElement | null>(null);
    const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const homeRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const [isCompact, setIsCompact] = useState(false);
    const configuredSlotSize = Number.isFinite(config.slotSize) ? clamp(Number(config.slotSize), 44, 96) : 66;
    const slotSize = isCompact ? Math.round(configuredSlotSize * 0.84) : Math.round(configuredSlotSize);
    const snapDistance = Number.isFinite(config.snapDistance)
      ? Math.max(18, Number(config.snapDistance))
      : Math.max(26, slotSize * 0.62);

    const [slotCenters, setSlotCenters] = useState<Record<string, Point>>({});
    const [homeCenters, setHomeCenters] = useState<Record<string, Point>>({});
    const [anchorsReady, setAnchorsReady] = useState(false);
    const [pieceLocations, setPieceLocations] = useState<Record<string, PieceLocation>>(initialPieceLocations(pieceInstances));
    const [pickedPieceId, setPickedPieceId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [slotFeedback, setSlotFeedback] = useState<Record<string, SlotFeedback>>(emptySlotFeedback(slotIds));
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
      if (validationIssues.length === 0) {
        return;
      }

      console.error("Invalid dragDropEquation config:", validationIssues);
    }, [validationIssues]);

    useEffect(() => {
      if (typeof window === "undefined") {
        return;
      }

      const media = window.matchMedia("(max-width: 700px)");
      const sync = () => setIsCompact(media.matches);
      sync();
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }, []);

    useEffect(() => {
      setPieceLocations(initialPieceLocations(pieceInstances));
      setPickedPieceId(null);
      setDragState(null);
      setSlotFeedback(emptySlotFeedback(slotIds));
      setIsLocked(false);
    }, [pieceInstances, slotIds]);

    useEffect(() => {
      const measureAnchors = () => {
        const board = boardRef.current;
        if (!board) {
          setAnchorsReady(false);
          return;
        }

        const boardRect = board.getBoundingClientRect();
        const nextSlotCenters: Record<string, Point> = {};
        const nextHomeCenters: Record<string, Point> = {};
        let isComplete = true;

        for (const slotId of slotIds) {
          const slotElement = slotRefs.current[slotId];
          if (!slotElement) {
            isComplete = false;
            continue;
          }

          const rect = slotElement.getBoundingClientRect();
          nextSlotCenters[slotId] = {
            x: rect.left - boardRect.left + rect.width / 2,
            y: rect.top - boardRect.top + rect.height / 2
          };
        }

        for (const instance of pieceInstances) {
          const homeElement = homeRefs.current[instance.instanceId];
          if (!homeElement) {
            isComplete = false;
            continue;
          }

          const rect = homeElement.getBoundingClientRect();
          nextHomeCenters[instance.instanceId] = {
            x: rect.left - boardRect.left + rect.width / 2,
            y: rect.top - boardRect.top + rect.height / 2
          };
        }

        setSlotCenters(nextSlotCenters);
        setHomeCenters(nextHomeCenters);
        setAnchorsReady(isComplete);
      };

      const animationFrame = requestAnimationFrame(measureAnchors);
      window.addEventListener("resize", measureAnchors);
      const resizeObserver =
        typeof ResizeObserver !== "undefined" && boardRef.current ? new ResizeObserver(measureAnchors) : null;
      if (resizeObserver && boardRef.current) {
        resizeObserver.observe(boardRef.current);
      }

      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", measureAnchors);
        resizeObserver?.disconnect();
      };
    }, [pieceInstances, slotIds, slotSize]);

    const slotOccupants = useMemo(() => buildSlotOccupants(pieceLocations, slotIds), [pieceLocations, slotIds]);
    const allSlotsFilled = useMemo(() => slotIds.every((slotId) => slotOccupants[slotId] !== null), [slotIds, slotOccupants]);

    useEffect(() => {
      onFilledChange?.(allSlotsFilled && !isLocked);
    }, [allSlotsFilled, isLocked, onFilledChange]);

    function resetBoard(): void {
      setPieceLocations(initialPieceLocations(pieceInstances));
      setPickedPieceId(null);
      setDragState(null);
      setSlotFeedback(emptySlotFeedback(slotIds));
      setIsLocked(false);
    }

    function boardPoint(clientX: number, clientY: number): Point | null {
      const board = boardRef.current;
      if (!board) {
        return null;
      }

      const rect = board.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function locationCenter(pieceInstanceId: string, location: PieceLocation): Point | null {
      if (location.kind === "slot") {
        return slotCenters[location.slotId] ?? null;
      }
      return homeCenters[pieceInstanceId] ?? null;
    }

    function movePieceHome(nextLocations: Record<string, PieceLocation>, pieceInstanceId: string): void {
      const piece = pieceByInstanceId[pieceInstanceId];
      if (!piece) {
        return;
      }
      nextLocations[pieceInstanceId] = { kind: "home", homeIndex: piece.homeIndex };
    }

    function placePieceInSlot(pieceInstanceId: string, slotId: string): void {
      setPieceLocations((previous) => {
        const next = { ...previous };
        const occupants = buildSlotOccupants(next, slotIds);
        const occupiedPiece = occupants[slotId];
        if (occupiedPiece && occupiedPiece !== pieceInstanceId) {
          movePieceHome(next, occupiedPiece);
        }
        next[pieceInstanceId] = { kind: "slot", slotId };
        return next;
      });
    }

    function nearestSlotId(point: Point): string | null {
      let closestSlot: string | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const slotId of slotIds) {
        const center = slotCenters[slotId];
        if (!center) {
          continue;
        }

        const distance = Math.hypot(point.x - center.x, point.y - center.y);
        if (distance <= snapDistance && distance < closestDistance) {
          closestDistance = distance;
          closestSlot = slotId;
        }
      }

      return closestSlot;
    }

    function checkAnswerInternal(): { isCorrect: boolean } | null {
      if (!isValidConfig || isLocked || !allSlotsFilled) {
        return null;
      }

      const assignmentsBySlotId: Record<string, string> = {};
      for (const slotId of slotIds) {
        const occupyingInstance = slotOccupants[slotId];
        if (!occupyingInstance) {
          return null;
        }
        const piece = pieceByInstanceId[occupyingInstance];
        assignmentsBySlotId[slotId] = piece.pieceId;
      }

      const match = evaluateAssignments(assignmentsBySlotId, slotIds, config.acceptedAnswers);
      const nextFeedback = emptySlotFeedback(slotIds);
      for (const slotId of slotIds) {
        nextFeedback[slotId] = match.slotCorrectness[slotId] ? "correct" : "incorrect";
      }

      setPickedPieceId(null);
      setDragState(null);
      setSlotFeedback(nextFeedback);
      setIsLocked(true);

      return { isCorrect: match.isCorrect };
    }

    function showAnswerInternal(): void {
      if (!isValidConfig || config.acceptedAnswers.length === 0) {
        return;
      }

      const selectedAnswer = config.acceptedAnswers[0];
      const piecePoolByPieceId: Record<string, string[]> = {};
      for (const instance of pieceInstances) {
        if (!piecePoolByPieceId[instance.pieceId]) {
          piecePoolByPieceId[instance.pieceId] = [];
        }
        piecePoolByPieceId[instance.pieceId].push(instance.instanceId);
      }

      const nextLocations = initialPieceLocations(pieceInstances);
      for (const slotId of slotIds) {
        const neededPieceId = selectedAnswer[slotId];
        const pool = piecePoolByPieceId[neededPieceId];
        const chosenInstanceId = pool?.shift();
        if (!chosenInstanceId) {
          return;
        }
        nextLocations[chosenInstanceId] = { kind: "slot", slotId };
      }

      const nextFeedback = emptySlotFeedback(slotIds);
      for (const slotId of slotIds) {
        nextFeedback[slotId] = "correct";
      }

      setPieceLocations(nextLocations);
      setPickedPieceId(null);
      setDragState(null);
      setSlotFeedback(nextFeedback);
      setIsLocked(true);
    }

    useImperativeHandle(
      ref,
      () => ({
        check: checkAnswerInternal,
        retry: resetBoard,
        showAnswer: showAnswerInternal
      })
    );

    function handlePiecePointerDown(event: PointerEvent<HTMLButtonElement>, pieceInstanceId: string): void {
      if (!anchorsReady || isLocked) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const location = pieceLocations[pieceInstanceId];
      if (!location) {
        return;
      }

      const center = locationCenter(pieceInstanceId, location);
      const point = boardPoint(event.clientX, event.clientY);
      if (!center || !point) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setPickedPieceId(null);
      setDragState({
        pieceInstanceId,
        pointerId: event.pointerId,
        offsetX: point.x - center.x,
        offsetY: point.y - center.y,
        center,
        hasMoved: false
      });
    }

    function handlePiecePointerMove(event: PointerEvent<HTMLButtonElement>, pieceInstanceId: string): void {
      setDragState((current) => {
        if (!current || current.pieceInstanceId !== pieceInstanceId || current.pointerId !== event.pointerId) {
          return current;
        }

        const point = boardPoint(event.clientX, event.clientY);
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

    function handlePiecePointerUp(event: PointerEvent<HTMLButtonElement>, pieceInstanceId: string): void {
      const currentDrag = dragState;
      if (!currentDrag || currentDrag.pieceInstanceId !== pieceInstanceId || currentDrag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const point = boardPoint(event.clientX, event.clientY);
      const releasedCenter = point
        ? {
            x: point.x - currentDrag.offsetX,
            y: point.y - currentDrag.offsetY
          }
        : currentDrag.center;

      setDragState(null);

      if (!currentDrag.hasMoved) {
        setPickedPieceId((current) => (current === pieceInstanceId ? null : pieceInstanceId));
        return;
      }

      const snappedSlotId = nearestSlotId(releasedCenter);
      if (snappedSlotId) {
        placePieceInSlot(pieceInstanceId, snappedSlotId);
        return;
      }

      setPieceLocations((previous) => {
        const next = { ...previous };
        movePieceHome(next, pieceInstanceId);
        return next;
      });
    }

    function handlePiecePointerCancel(event: PointerEvent<HTMLButtonElement>, pieceInstanceId: string): void {
      if (!dragState || dragState.pieceInstanceId !== pieceInstanceId || dragState.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setDragState(null);
    }

    function handlePieceKeyDown(event: KeyboardEvent<HTMLButtonElement>, pieceInstanceId: string): void {
      if (isLocked) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setPickedPieceId(null);
        return;
      }

      if ((event.key === "Backspace" || event.key === "Delete") && pieceLocations[pieceInstanceId]?.kind === "slot") {
        event.preventDefault();
        setPieceLocations((previous) => {
          const next = { ...previous };
          movePieceHome(next, pieceInstanceId);
          return next;
        });
        return;
      }

      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
        return;
      }

      event.preventDefault();
      setPickedPieceId((current) => (current === pieceInstanceId ? null : pieceInstanceId));
    }

    function handleSlotActivate(slotId: string): void {
      if (isLocked) {
        return;
      }

      if (pickedPieceId) {
        placePieceInSlot(pickedPieceId, slotId);
        setPickedPieceId(null);
        return;
      }

      const occupant = slotOccupants[slotId];
      if (occupant) {
        setPickedPieceId(occupant);
      }
    }

    function handleSlotKeyDown(event: KeyboardEvent<HTMLButtonElement>, slotId: string): void {
      if (event.key === "Escape") {
        event.preventDefault();
        setPickedPieceId(null);
        return;
      }

      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") {
        return;
      }

      event.preventDefault();
      handleSlotActivate(slotId);
    }

    if (!isValidConfig) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold text-red-800">Invalid drag/drop widget configuration.</p>
          <ul className="mt-2 list-disc pl-5">
            {validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      );
    }

    const lineWrapClasses = config.allowWrap ? "flex-wrap" : "flex-nowrap overflow-x-auto";

    return (
      <div
        ref={boardRef}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape") {
            setPickedPieceId(null);
          }
        }}
        className="relative px-1 pb-3 pt-1"
      >
        <div className={`flex items-center justify-center gap-3 ${lineWrapClasses}`}>
          {config.tokens.map((token, index) => {
            if (token.kind === "slot") {
              const feedback = slotFeedback[token.slotId];
              const isDropTarget = Boolean(pickedPieceId) && !isLocked;
              const slotClasses =
                feedback === "correct"
                  ? "border-emerald-500 bg-emerald-50"
                  : feedback === "incorrect"
                    ? "border-amber-400 bg-amber-50"
                    : isDropTarget
                      ? "border-slate-400 bg-white"
                      : "border-slate-300 bg-white";

              return (
                <button
                  key={`${token.slotId}-${index}`}
                  ref={(element) => {
                    slotRefs.current[token.slotId] = element;
                  }}
                  type="button"
                  onClick={() => handleSlotActivate(token.slotId)}
                  onKeyDown={(event) => handleSlotKeyDown(event, token.slotId)}
                  aria-label={`Target box ${index + 1}`}
                  disabled={isLocked}
                  className={`shrink-0 rounded-md border-2 border-dotted transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-default ${slotClasses}`}
                  style={{ width: slotSize, height: slotSize }}
                />
              );
            }

            const isLatex = token.latex ?? defaultLatex;
            return (
              <InlineExpression
                key={`text-${index}-${token.value}`}
                value={token.value}
                isLatex={isLatex}
                className="shrink-0 text-2xl font-semibold text-slate-900"
              />
            );
          })}
        </div>

        <div className="mt-9 flex justify-center">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-3">
            {pieceInstances.map((instance, index) => (
              <div
                key={`home-${instance.instanceId}`}
                ref={(element) => {
                  homeRefs.current[instance.instanceId] = element;
                }}
                aria-hidden
                className="pointer-events-none opacity-0"
                style={{ width: slotSize, height: slotSize }}
                data-home-index={index}
              />
            ))}
          </div>
        </div>

        {pieceInstances.map((instance) => {
          const location = pieceLocations[instance.instanceId];
          const feedback =
            location?.kind === "slot" && slotFeedback[location.slotId] ? slotFeedback[location.slotId] : null;
          const isDragging = dragState?.pieceInstanceId === instance.instanceId;
          const isPicked = pickedPieceId === instance.instanceId;
          const center = isDragging
            ? dragState?.center ?? null
            : location
              ? locationCenter(instance.instanceId, location)
              : null;

          if (!center) {
            return null;
          }

          const baseClasses =
            feedback === "correct"
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : feedback === "incorrect"
                ? "border-amber-400 bg-amber-50 text-amber-900"
                : isPicked
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-slate-300 bg-slate-200 text-slate-900";

          return (
            <button
              key={`piece-${instance.instanceId}`}
              type="button"
              onPointerDown={(event) => handlePiecePointerDown(event, instance.instanceId)}
              onPointerMove={(event) => handlePiecePointerMove(event, instance.instanceId)}
              onPointerUp={(event) => handlePiecePointerUp(event, instance.instanceId)}
              onPointerCancel={(event) => handlePiecePointerCancel(event, instance.instanceId)}
              onKeyDown={(event) => handlePieceKeyDown(event, instance.instanceId)}
              aria-pressed={isPicked}
              aria-label={`Piece ${instance.label}`}
              disabled={isLocked}
              className={`absolute left-0 top-0 flex select-none items-center justify-center rounded-md border font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-default ${
                isDragging ? "z-30 cursor-grabbing" : "cursor-grab"
              } ${baseClasses} ${isDragging ? "" : "transition-transform duration-200 ease-out"}`}
              style={{
                width: slotSize,
                height: slotSize,
                transform: `translate(${center.x - slotSize / 2}px, ${center.y - slotSize / 2}px)`
              }}
            >
              <InlineExpression value={instance.label} isLatex={instance.latex} className="pointer-events-none text-2xl leading-none" />
            </button>
          );
        })}
      </div>
    );
  }
);

DragDropEquationWidget.displayName = "DragDropEquationWidget";

export default DragDropEquationWidget;
