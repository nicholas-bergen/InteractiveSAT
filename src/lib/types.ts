export type ItemType = "mcq" | "freeResponse" | "interactive";

export type InteractiveWidgetId = "balanceScale" | "dragDropEquation" | "equationScale";
export type VisualWidgetId = "singleDigitalScale";
export type QuestionPart = "single" | "starterQuestion" | "satQuestion";

export type BalanceState = "left_heavier" | "right_heavier" | "balanced";
export type ScaleShapeType = "circle" | "square" | "triangle";

export interface ScaleShapeGroup {
  type: ScaleShapeType;
  count: number;
  labels?: string[];
  fill?: string;
}

export interface ScaleWeightGroup {
  count: number;
  labels?: string[];
  fill?: string;
}

export interface SingleDigitalScaleConfig {
  // Numeric source value for lesson logic or default display text.
  scaleDisplayValue: number;

  // Optional text override shown on the scale display.
  // Set to null to show String(scaleDisplayValue), matching Observable behavior.
  scaleDisplayText: string | null;

  // One or more shape groups that are flattened left-to-right on the platform.
  shapeGroups: ScaleShapeGroup[];

  // Optional weight groups rendered on the right side of the platform.
  weightGroups?: ScaleWeightGroup[];

  layout: {
    // Supported now: container max width.
    maxWidth: number;
    // Reserved for future parity with Observable responsive breakpoint behavior.
    mobileBreakpoint?: number;
  };
}

export type VisualWidget = {
  id: "singleDigitalScale";
  config: SingleDigitalScaleConfig;
};

export type DragDropLineToken =
  | {
      kind: "text";
      value: string;
      // Defaults to true when omitted.
      latex?: boolean;
    }
  | {
      kind: "slot";
      slotId: string;
    };

export interface DragDropPiece {
  id: string;
  label: string;
  // Defaults to true when omitted.
  latex?: boolean;
  // Number of draggable copies generated for this piece; defaults to 1.
  uses?: number;
}

export interface DragDropEquationConfig {
  tokens: DragDropLineToken[];
  pieces: DragDropPiece[];
  // Each accepted answer maps slot ids to piece ids.
  acceptedAnswers: Array<Record<string, string>>;
  // Optional static visual widget shown above this interaction.
  pairedVisualWidget?: VisualWidget;
  // Box/piece size in px. Defaults to responsive sizing when omitted.
  slotSize?: number;
  // Keeps one line by default; set true to allow wrapping.
  allowWrap?: boolean;
  // Defaults to true, so text/piece labels render as KaTeX unless overridden.
  defaultLatex?: boolean;
  // Distance in px for snap-to-slot behavior.
  snapDistance?: number;
}

export interface EquationScaleWeight {
  id: string;
  label: string;
  fill?: string;
  // Defaults to true; non-removable weights stay on the scale.
  removable?: boolean;
}

export interface EquationScaleConfig {
  // Numeric source value shown on the digital display before removals.
  scaleDisplayValue: number;
  // Optional text override shown on the scale display.
  // Set to null to show String(scaleDisplayValue).
  scaleDisplayText?: string | null;
  shapeGroups: ScaleShapeGroup[];
  // Individual weight definitions for draggable/removable behavior.
  weights: EquationScaleWeight[];
  // Which removable weights must be off-scale for a correct check.
  // Defaults to all removable weights.
  requiredRemovedWeightIds?: string[];
  // Distance in px from the platform surface used to snap back onto the scale.
  snapBackThreshold?: number;
  layout?: {
    maxWidth?: number;
    mobileBreakpoint?: number;
  };
}

export interface SatQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
  // Render choices using KaTeX when true.
  choicesLatex?: boolean;
  // Rendered in KaTeX when present.
  mathLatex?: string;
  // Optional image support for SAT-style prompts.
  imageSrc?: string;
  imageAlt?: string;
}

interface LessonItemBase {
  id: string;
  type: ItemType;
  prompt: string;
  hint?: string;
  explanation?: string;
}

export interface McqItem extends LessonItemBase {
  type: "mcq";
  // Starter question fields.
  choices: string[];
  answerIndex: number;
  // Render starter choices using KaTeX when true.
  choicesLatex?: boolean;
  // Optional static visualization shown above choices.
  visualWidget?: VisualWidget;
  // Optional second part (shown only after starter is answered correctly).
  satQuestion?: SatQuestion;
}

export interface FreeResponseItem extends LessonItemBase {
  type: "freeResponse";
  acceptableAnswers: string[];
  placeholder?: string;
}

export interface BalanceScaleInteractiveItem extends LessonItemBase {
  type: "interactive";
  widget: "balanceScale";
  config: {
    leftMass: number;
    rightMass: number;
  };
  expectedState: BalanceState;
}

export interface DragDropEquationInteractiveItem extends LessonItemBase {
  type: "interactive";
  widget: "dragDropEquation";
  config: DragDropEquationConfig;
}

export interface EquationScaleInteractiveItem extends LessonItemBase {
  type: "interactive";
  widget: "equationScale";
  config: EquationScaleConfig;
}

export type InteractiveItem = BalanceScaleInteractiveItem | DragDropEquationInteractiveItem | EquationScaleInteractiveItem;

export type LessonItem = McqItem | FreeResponseItem | InteractiveItem;

export interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  items: LessonItem[];
}

export type StudentResponse =
  | { kind: "mcq"; selectedIndex: number | null; questionPart: QuestionPart }
  | { kind: "freeResponse"; text: string }
  | { kind: "interactive"; widget: "balanceScale"; value: BalanceState | null }
  | { kind: "interactive"; widget: "dragDropEquation"; isCorrect: boolean | null }
  | { kind: "interactive"; widget: "equationScale"; isCorrect: boolean | null };

export interface GradeResult {
  isCorrect: boolean;
  message: string;
}

export interface Attempt {
  lessonId: string;
  itemId: string;
  questionPart: QuestionPart;
  submittedAt: string;
  response: StudentResponse;
  result: GradeResult;
}

export interface LessonProgress {
  lessonId: string;
  attemptedItems: number;
  totalItems: number;
}

export interface ReviewItem {
  lessonId: string;
  lessonTitle: string;
  itemId: string;
  prompt: string;
  satPrompt?: string;
  missedParts: QuestionPart[];
}
