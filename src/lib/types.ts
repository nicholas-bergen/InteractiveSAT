export type ItemType = "mcq" | "freeResponse" | "interactive";

export type InteractiveWidgetId = "balanceScale";
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

export interface SatQuestion {
  prompt: string;
  choices: string[];
  answerIndex: number;
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

export type InteractiveItem = BalanceScaleInteractiveItem;

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
  | { kind: "interactive"; value: BalanceState | null };

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
