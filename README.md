# Lesson Lab (Starter Scaffold)

This is a minimal **Next.js + React + TypeScript + Tailwind** scaffold for a lesson app with:

- a homepage menu (`/`)
- a dedicated lesson runner page (`/lesson/[lessonId]`)
- a dedicated review page (`/review`)
- local-first attempt storage (`localStorage`)
- reusable interactive widgets (SVG first, D3 only when needed)

## Why this structure

- `src/app/.../page.tsx`: routing and page-level loading
- `src/components/...`: reusable UI pieces
- `src/content/...`: lesson/item data
- `src/lib/...`: logic helpers (types, grading, storage, review)

This keeps content, rendering, and app logic separate so adding lessons/widgets remains straightforward.

## Quick start

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Add a new lesson

1. Open `src/content/lessons.ts`.
2. Add another object to the `lessons` array.
3. Use a unique `id` and `item.id` values.
4. The homepage and dynamic lesson route will pick it up automatically.

## Attach the static digital scale to an MCQ item

Use the optional `visualWidget` field on an MCQ item:

```ts
{
  id: "my-question",
  type: "mcq",
  prompt: "What is one circle worth?",
  choices: ["1", "2", "3", "4"],
  answerIndex: 1,
  visualWidget: {
    id: "singleDigitalScale",
    config: {
      scaleDisplayValue: 8,
      scaleDisplayText: null,
      shapeGroups: [{ type: "circle", count: 4, labels: ["", "", "", ""], fill: "#bfeeb8" }],
      weightGroups: [{ count: 1, labels: ["180"], fill: "#667286" }],
      layout: { maxWidth: 560 }
    }
  }
}
```

This widget is static visual output only. Answer checking stays in the MCQ flow.

Notes:
- `shapeGroups` always render on the left side of the scale platform.
- `weightGroups` always render on the right side.
- `labels` can be empty strings or numbers-as-strings.

## Two-Part MCQ (Starter + SAT)

Any MCQ item can add a second part with `satQuestion`:

```ts
{
  id: "two-part",
  type: "mcq",
  prompt: "How much does one square weigh?",
  choices: ["14", "65", "86", "250"],
  answerIndex: 0,
  satQuestion: {
    prompt: "What value of p satisfies the equation",
    mathLatex: "5p + 180 = 250",
    choices: ["14", "65", "86", "250"],
    answerIndex: 0
  }
}
```

Flow:
- Student sees only starter choices first.
- After a correct starter answer, starter choices disappear and SAT choices appear.
- Only one answer set is visible at a time.

## Add a new widget

1. Create a component in `src/components/widgets/`.
2. Extend widget types in `src/lib/types.ts` (for example `VisualWidget` for static displays or `InteractiveItem` for interactive tools).
3. Add rendering logic in `src/components/ItemRenderer.tsx` for the new widget id.

This keeps widget logic isolated and reusable across multiple lessons.
