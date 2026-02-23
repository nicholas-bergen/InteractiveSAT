# Observable Scale Prototype v0.1 (Modular Cells)

Paste each block below into its own Observable cell, in order.

## 1) `config` cell

```js
config = ({
  // -------------------------------
  // Top-level lesson content fields
  // -------------------------------
  questionText: "What's the weight of one circle?",

  // Keep this numeric for algebra calculations.
  scaleDisplayValue: 8,

  // Optional display override for the scale screen.
  // Leave null to show String(scaleDisplayValue).
  scaleDisplayText: null,

  // Answer options and correct answer.
  answerChoices: ["1", "2", "4", "8"],
  correctAnswer: "2",

  // -----------------------------------------------------------------
  // Shape groups are intentionally configurable for future question sets
  // - For v0.1 assume a single group (first item used in algebra section)
  // - type: "circle" | "square" | "triangle"
  // - count: how many shapes appear on the scale
  // - labels: optional text per shape
  // - fill: shape color
  // -----------------------------------------------------------------
  shapeGroups: [
    {
      type: "circle",
      count: 4,
      labels: ["", "", "", ""],
      fill: "#bfeeb8"
    }
  ],

  // ----------------------
  // Layout configuration
  // ----------------------
  layout: {
    maxWidth: 600,
    mobileBreakpoint: 560
  }
})
```

## 2) `styles` cell

```js
styles = html`
<style>
  /*
    Global card-level design variables.
    Keep these in one place for easy visual retheming later.
  */
  .scale-quiz-root {
    --panel-bg: linear-gradient(180deg, #fcfcfd 0%, #f7f8fa 100%);
    --panel-border: #e4e8ed;
    --text-primary: #1f2937;

    --neutral-btn-border: #d0d7e2;
    --neutral-btn-bg: #ffffff;
    --hover-blue: #6fb4ff;
    --selected-blue-border: #2f80ed;
    --selected-blue-bg: #eaf3ff;

    --wrong-red-border: #e14141;
    --wrong-red-bg: #feeaea;
    --correct-green-border: #1fb451;
    --correct-green-bg: #e9f8ee;

    --check-border: #cad2dd;
    --check-text: #4b5563;

    --accent-number: #2f63ff;

    font-family: "Nunito", "Avenir Next", "Segoe UI", sans-serif;
    color: var(--text-primary);
    width: 100%;
    max-width: var(--quiz-max-width, 600px);
    margin: 16px auto;
    padding: 26px 22px 22px;
    border-radius: 24px;
    border: 1px solid var(--panel-border);
    background: var(--panel-bg);
    box-shadow: 0 10px 28px rgba(18, 29, 45, 0.07);
    box-sizing: border-box;
  }

  .scale-quiz-question {
    margin: 0 0 14px;
    text-align: center;
    font-size: clamp(24px, 3.7vw, 34px);
    line-height: 1.15;
    font-weight: 800;
    letter-spacing: 0.2px;
    color: var(--text-primary);
  }

  .scale-quiz-scale-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .scale-quiz-answers {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 8px 0 16px;
  }

  .scale-answer-btn {
    position: relative;
    min-height: 62px;
    border: 2px solid var(--neutral-btn-border);
    border-radius: 16px;
    background: var(--neutral-btn-bg);
    color: #2b3240;
    font-size: 30px;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease, color 140ms ease;
  }

  .scale-answer-btn:hover:not(:disabled) {
    border-color: var(--hover-blue);
    box-shadow: 0 0 0 2px rgba(111, 180, 255, 0.2);
  }

  /* Selected state before submission */
  .scale-answer-btn.is-selected {
    border-color: var(--selected-blue-border);
    background: var(--selected-blue-bg);
    font-weight: 800;
    box-shadow: 0 0 0 2px rgba(47, 128, 237, 0.15);
  }

  /* Correct state after pressing Check */
  .scale-answer-btn.is-correct {
    border-color: var(--correct-green-border);
    background: var(--correct-green-bg);
    color: #138a3c;
    font-weight: 800;
    box-shadow: 0 0 0 2px rgba(31, 180, 81, 0.13);
  }

  /* Incorrect state after pressing Check */
  .scale-answer-btn.is-incorrect {
    border-color: var(--wrong-red-border);
    background: var(--wrong-red-bg);
    color: #b72525;
    font-weight: 800;
    box-shadow: 0 0 0 2px rgba(225, 65, 65, 0.14);
  }

  .scale-answer-btn.is-locked {
    cursor: default;
  }

  /* Emoji-style vector icon container in top-right corner */
  .scale-answer-icon {
    position: absolute;
    top: -12px;
    right: -10px;
    width: 34px;
    height: 34px;
    display: none;
    pointer-events: none;
  }

  .scale-answer-icon.is-visible {
    display: block;
  }

  .scale-check-btn {
    width: 100%;
    min-height: 58px;
    border-radius: 999px;
    border: 2px solid var(--check-border);
    background: #ffffff;
    color: var(--check-text);
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: opacity 140ms ease, box-shadow 140ms ease, transform 100ms ease, border-color 140ms ease;
  }

  /* Dimmed state when no answer has been selected */
  .scale-check-btn.is-dimmed {
    opacity: 0.43;
    cursor: not-allowed;
    box-shadow: none;
  }

  .scale-check-btn.is-ready {
    opacity: 1;
    box-shadow: 0 8px 16px rgba(23, 35, 54, 0.1);
  }

  .scale-check-btn:active:not(:disabled) {
    transform: translateY(1px);
  }

  /* Visual state when answer is solved correctly */
  .scale-check-btn.is-correct {
    border-color: #a9dfbd;
    color: #1c8c44;
    background: #f4fbf6;
    box-shadow: none;
    cursor: default;
  }

  /* ------------------------------
     Post-correct teaching section
     ------------------------------ */
  .scale-postcorrect {
    margin-top: 14px;
    padding: 14px;
    border-radius: 18px;
    border: 1px dashed #d9dfe8;
    background: #ffffff;
  }

  .is-hidden {
    display: none !important;
  }

  .fade-item {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 500ms ease, transform 500ms ease;
  }

  .fade-item.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  .scale-alt-summary {
    margin-bottom: 10px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1.05fr 0.34fr 0.88fr 0.34fr 1.05fr;
    align-items: center;
    justify-items: center;
    column-gap: 6px;
    row-gap: 8px;
  }

  .summary-label-row {
    margin-bottom: 6px;
  }

  .summary-cell {
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1.1;
  }

  .summary-cell.word {
    font-size: clamp(24px, 3.6vw, 32px);
    font-weight: 700;
    color: #2d3544;
  }

  .summary-cell.number .katex {
    color: var(--accent-number);
    font-weight: 800;
  }

  .summary-math-row .katex,
  .algebra-line .katex,
  .fraction-cell .katex {
    font-size: 1.68em;
  }

  .summary-math-row .number .katex,
  .algebra-line .number .katex,
  .fraction-cell .number .katex {
    color: var(--accent-number);
    font-weight: 800;
  }

  .shape-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .shape-chip.is-faded {
    opacity: 0.23;
  }

  .shape-chip svg {
    display: block;
  }

  /* "Show algebraic solution" button reuses check button style */
  .scale-solution-btn {
    margin-top: 8px;
    transition: opacity 500ms ease, transform 500ms ease, box-shadow 140ms ease, border-color 140ms ease;
  }

  .scale-solution-btn.is-fading-out {
    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;
  }

  .scale-solution-btn.is-gone {
    display: none;
  }

  .scale-algebra {
    margin-top: 16px;
    padding-top: 18px;
    border-top: 1px solid #e6ebf2;
  }

  .algebra-grid {
    display: grid;
    row-gap: 24px;
  }

  .algebra-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 170px;
    column-gap: 16px;
    align-items: center;
  }

  .algebra-main {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .algebra-line {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: nowrap;
  }

  .divide-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    gap: 12px;
  }

  .fraction-cell {
    display: grid;
    justify-items: center;
    min-width: 128px;
  }

  .fraction-top {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 8px 5px;
    border-bottom: 2px solid #3c4350;
  }

  .fraction-bottom {
    min-height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 4px;
  }

  .algebra-note-col {
    font-size: clamp(14px, 1.9vw, 16px);
    font-weight: 700;
    line-height: 1.25;
    color: #384355;
    text-align: left;
    justify-self: start;
  }

  .note-number {
    color: var(--accent-number);
    font-weight: 800;
  }

  .shape-row {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    max-width: 100%;
  }

  /* Mobile collapse to one-column answer layout */
  @media (max-width: ${config.layout.mobileBreakpoint}px) {
    .scale-quiz-root {
      padding: 20px 16px 18px;
      border-radius: 20px;
    }

    .scale-quiz-answers {
      grid-template-columns: 1fr;
    }

    .scale-answer-btn {
      font-size: 28px;
      min-height: 58px;
    }

    .scale-check-btn {
      font-size: 28px;
      min-height: 56px;
    }

    .summary-grid {
      grid-template-columns: 1fr 0.3fr 0.8fr 0.3fr 1fr;
      column-gap: 3px;
    }

    .fraction-cell {
      min-width: 112px;
    }

    .algebra-row {
      grid-template-columns: minmax(0, 1fr) 128px;
      column-gap: 10px;
    }

    .algebra-note-col {
      font-size: 13px;
    }
  }
</style>
`
```

## 3) `render` cell

```js
render = {
  // Ensure style rules are injected before UI elements are created.
  styles;

  // -------------------------------
  // Helper: flatten shape group specs
  // -------------------------------
  function expandShapeGroups(shapeGroups = []) {
    const flatShapes = [];

    for (const group of shapeGroups) {
      const { type = "circle", count = 0, labels = [], fill = "#bfeeb8" } = group;

      for (let i = 0; i < count; i += 1) {
        flatShapes.push({
          type,
          label: labels[i] ?? "",
          fill
        });
      }
    }

    return flatShapes;
  }

  // ----------------------------------------------------
  // Helpers: math formatting for symbolic/algebra display
  // ----------------------------------------------------
  function gcd(a, b) {
    const x = Math.abs(a);
    const y = Math.abs(b);

    if (y === 0) return x || 1;
    return gcd(y, x % y);
  }

  function toReducedFraction(numerator, denominator) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return { numerator: 0, denominator: 1 };
    }

    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      // Fraction fallback for non-integers: convert to 1/1000 precision first.
      const scaledNum = Math.round(numerator * 1000);
      const scaledDen = Math.round(denominator * 1000);
      return toReducedFraction(scaledNum, scaledDen);
    }

    const divisor = gcd(numerator, denominator);
    const sign = denominator < 0 ? -1 : 1;

    return {
      numerator: (numerator / divisor) * sign,
      denominator: Math.abs(denominator / divisor)
    };
  }

  function toLatexValueFromFraction(frac) {
    if (frac.denominator === 1) {
      return String(frac.numerator);
    }

    return `\\frac{${frac.numerator}}{${frac.denominator}}`;
  }

  function toPlainValueFromFraction(frac) {
    if (frac.denominator === 1) {
      return String(frac.numerator);
    }

    return `${frac.numerator}/${frac.denominator}`;
  }

  function texToken(latexText, className = "") {
    const token = html`<span class="${className}"></span>`;
    token.append(tex`${latexText}`);
    return token;
  }

  function shapeNameFromType(type) {
    if (type === "square") return "square";
    if (type === "triangle") return "triangle";
    return "circle";
  }

  function pluralizeShape(shapeName, count) {
    if (count === 1) return shapeName;

    if (shapeName === "triangle") return "triangles";
    return `${shapeName}s`;
  }

  // --------------------------------------------------------
  // Helpers: convert whole numbers to English words (v0.1 UI)
  // --------------------------------------------------------
  function integerToEnglish(value) {
    if (!Number.isInteger(value)) return null;

    const ones = [
      "zero", "one", "two", "three", "four",
      "five", "six", "seven", "eight", "nine"
    ];
    const teens = [
      "ten", "eleven", "twelve", "thirteen", "fourteen",
      "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
    ];
    const tens = [
      "", "", "twenty", "thirty", "forty",
      "fifty", "sixty", "seventy", "eighty", "ninety"
    ];

    function underHundred(n) {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      const t = Math.floor(n / 10);
      const r = n % 10;
      return r === 0 ? tens[t] : `${tens[t]}-${ones[r]}`;
    }

    function underThousand(n) {
      if (n < 100) return underHundred(n);
      const h = Math.floor(n / 100);
      const r = n % 100;
      return r === 0
        ? `${ones[h]} hundred`
        : `${ones[h]} hundred ${underHundred(r)}`;
    }

    if (value === 0) return "zero";

    const sign = value < 0 ? "negative " : "";
    let n = Math.abs(value);

    if (n < 1000) return sign + underThousand(n);

    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      const prefix = `${underThousand(thousands)} thousand`;
      return sign + (remainder === 0 ? prefix : `${prefix} ${underThousand(remainder)}`);
    }

    return null;
  }

  function titleCaseWord(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function numberForEnglishOrFallback(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return String(value);
    }

    const englishWord = integerToEnglish(numericValue);
    if (englishWord !== null) {
      return titleCaseWord(englishWord);
    }

    return toPlainValueFromFraction(toReducedFraction(numericValue, 1));
  }

  // ---------------------------------------
  // Helper: render one shape as an SVG node
  // ---------------------------------------
  function drawScaleShape({ shape, cx, groundY, size }) {
    const label = shape.label ?? "";
    const fill = shape.fill || "#bfeeb8";

    if (shape.type === "square") {
      const x = cx - size / 2;
      const y = groundY - size;
      return svg`<g>
        <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="8"
          fill="${fill}" stroke="#8ebc88" stroke-width="1.5"></rect>
        ${label ? svg`<text x="${cx}" y="${y + size / 2 + 7}" text-anchor="middle" font-size="18" font-weight="700" fill="#2a5a2a">${label}</text>` : null}
      </g>`;
    }

    if (shape.type === "triangle") {
      const half = size / 2;
      const topY = groundY - size;
      const points = `${cx},${topY} ${cx - half},${groundY} ${cx + half},${groundY}`;
      return svg`<g>
        <polygon points="${points}" fill="${fill}" stroke="#8ebc88" stroke-width="1.5"></polygon>
        ${label ? svg`<text x="${cx}" y="${groundY - size * 0.35}" text-anchor="middle" font-size="16" font-weight="700" fill="#2a5a2a">${label}</text>` : null}
      </g>`;
    }

    // Default behavior: circle.
    const cy = groundY - size / 2;
    return svg`<g>
      <circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${fill}" stroke="#8ebc88" stroke-width="1.5"></circle>
      ${label ? svg`<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="18" font-weight="700" fill="#2a5a2a">${label}</text>` : null}
    </g>`;
  }

  // ----------------------------------------------------------------
  // Helper: generate shape icon for equation/algebra lines (vector)
  // ----------------------------------------------------------------
  function makeShapeIcon({ type = "circle", fill = "#bfeeb8", size = 58, faded = false }) {
    const icon = svg`<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"></svg>`;
    const stroke = "#8ebc88";

    if (type === "square") {
      icon.append(
        svg`<rect x="10" y="10" width="44" height="44" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.6"></rect>`,
        svg`<rect x="10" y="54" width="44" height="4" rx="2" fill="#d6dce4"></rect>`
      );
    } else if (type === "triangle") {
      icon.append(
        svg`<polygon points="32,10 10,54 54,54" fill="${fill}" stroke="${stroke}" stroke-width="1.6"></polygon>`,
        svg`<rect x="11" y="54" width="42" height="4" rx="2" fill="#d6dce4"></rect>`
      );
    } else {
      icon.append(
        svg`<circle cx="32" cy="30" r="22" fill="${fill}" stroke="${stroke}" stroke-width="1.6"></circle>`,
        svg`<rect x="10" y="54" width="44" height="4" rx="2" fill="#d6dce4"></rect>`
      );
    }

    const wrapper = html`<span class="shape-chip ${faded ? "is-faded" : ""}"></span>`;
    wrapper.append(icon);
    return wrapper;
  }

  // ----------------------------------------------------------
  // Helper: build the full scale illustration with shape stack
  // ----------------------------------------------------------
  function buildScaleSvg(scaleText, shapes) {
    const svgRoot = svg`<svg viewBox="0 0 420 240" width="100%" style="max-width:420px;height:auto;" aria-label="scale with shapes">
      <defs>
        <linearGradient id="metal-plate" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f0f2f5"></stop>
          <stop offset="100%" stop-color="#c8ced6"></stop>
        </linearGradient>
        <linearGradient id="metal-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#d7dde5"></stop>
          <stop offset="100%" stop-color="#b2bbc7"></stop>
        </linearGradient>
      </defs>

      <!-- Top plate where shapes rest -->
      <rect x="52" y="102" width="316" height="18" rx="10" fill="url(#metal-plate)" stroke="#8f97a3" stroke-width="2"></rect>

      <!-- Thin support strip under top plate -->
      <rect x="88" y="118" width="244" height="14" rx="7" fill="#a9b1bc" stroke="#8f97a3" stroke-width="1.6"></rect>

      <!-- Main body of digital scale -->
      <path d="M90 132 L330 132 L347 194 Q347 206 334 206 L86 206 Q73 206 73 194 Z"
        fill="url(#metal-body)" stroke="#8a93a0" stroke-width="2.2"></path>

      <!-- Display bezel -->
      <rect x="145" y="154" width="130" height="42" rx="8" fill="#c4cbd6" stroke="#858f9d" stroke-width="1.8"></rect>

      <!-- Display screen -->
      <rect x="153" y="160" width="114" height="30" rx="6" fill="#edf1f6" stroke="#9ca6b2" stroke-width="1.2"></rect>

      <!-- Configurable display text -->
      <text x="210" y="181" text-anchor="middle" font-size="28" font-weight="800" fill="#4f5968" letter-spacing="1">${scaleText}</text>

      <!-- Shape container -->
      <g data-shapes></g>
    </svg>`;

    // Keep shapes touching edge-to-edge while fitting available top width.
    const group = svgRoot.querySelector("[data-shapes]");
    const shapeCount = Math.max(shapes.length, 1);
    const platformLeft = 68;
    const platformWidth = 284;
    const maxDiameter = (platformWidth - 16) / shapeCount;
    const diameter = Math.min(34, maxDiameter);
    const groundY = 102; // Shapes touch top edge of the scale plate.
    const startCx = platformLeft + (platformWidth - shapeCount * diameter) / 2 + diameter / 2;

    shapes.forEach((shape, i) => {
      const cx = startCx + i * diameter;
      group.appendChild(drawScaleShape({ shape, cx, groundY, size: diameter }));
    });

    return svgRoot;
  }

  // ------------------------------------------------------
  // Helper: reusable emoji-style vector feedback indicators
  // ------------------------------------------------------
  const ICONS = {
    correct: `
      <svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true">
        <rect x="1" y="1" width="34" height="34" rx="9" fill="#22c55e" stroke="#16a34a" stroke-width="1.6"></rect>
        <path d="M10 18.5 L15.4 23.8 L26.4 12.8" fill="none" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    `,
    incorrect: `
      <svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true">
        <circle cx="18" cy="18" r="16.3" fill="#ef4444" stroke="#dc2626" stroke-width="1.6"></circle>
        <path d="M11.2 11.2 L24.8 24.8 M24.8 11.2 L11.2 24.8" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"></path>
      </svg>
    `
  };

  // -----------------------------------------------------
  // Derive single-shape algebra values from first group
  // -----------------------------------------------------
  const firstGroup = config.shapeGroups?.[0] || {
    type: "circle",
    count: 1,
    fill: "#bfeeb8"
  };

  const shapeType = firstGroup.type || "circle";
  const shapeFill = firstGroup.fill || "#bfeeb8";
  const shapeCount = Math.max(1, Number(firstGroup.count) || 1);
  const shapeSingular = shapeNameFromType(shapeType);
  const shapePlural = pluralizeShape(shapeSingular, shapeCount);

  const safeScaleValue = Number.isFinite(Number(config.scaleDisplayValue))
    ? Number(config.scaleDisplayValue)
    : 0;

  const scaleDisplayText = config.scaleDisplayText == null
    ? String(safeScaleValue)
    : String(config.scaleDisplayText);

  const unitValueFraction = toReducedFraction(safeScaleValue, shapeCount);
  const unitValueLatex = toLatexValueFromFraction(unitValueFraction);
  const unitValueText = toPlainValueFromFraction(unitValueFraction);
  const shapeCountWord = numberForEnglishOrFallback(shapeCount);
  const scaleValueWord = numberForEnglishOrFallback(safeScaleValue);

  // -------------------------
  // Build static DOM skeleton
  // -------------------------
  const root = html`<section class="scale-quiz-root"></section>`;
  root.style.setProperty("--quiz-max-width", `${config.layout.maxWidth}px`);

  const questionEl = html`<h2 class="scale-quiz-question">${config.questionText}</h2>`;
  const scaleWrap = html`<div class="scale-quiz-scale-wrap"></div>`;
  const answersWrap = html`<div class="scale-quiz-answers"></div>`;
  const checkBtn = html`<button class="scale-check-btn is-dimmed" disabled>Check</button>`;

  // Post-correct teaching container (hidden until correct answer).
  const postCorrectWrap = html`<section class="scale-postcorrect is-hidden"></section>`;
  const summaryWrap = html`<div class="scale-alt-summary fade-item"></div>`;
  const showAlgebraBtn = html`<button class="scale-check-btn scale-solution-btn fade-item is-dimmed" disabled>show algebraic solution</button>`;
  const algebraWrap = html`<div class="scale-algebra fade-item is-hidden"></div>`;

  // Build SVG scale illustration from config values.
  const shapes = expandShapeGroups(config.shapeGroups);
  const scaleSvg = buildScaleSvg(scaleDisplayText, shapes);
  scaleWrap.append(scaleSvg);

  // Build answer buttons (2x2 desktop; responsive collapse in CSS).
  const answerButtons = config.answerChoices.map((choiceText, index) => {
    const btn = html`<button class="scale-answer-btn" type="button" data-index="${index}" aria-pressed="false">
      <span>${choiceText}</span>
      <span class="scale-answer-icon" aria-hidden="true"></span>
    </button>`;

    answersWrap.append(btn);
    return btn;
  });

  // -----------------------------------------------
  // Build the alternative representation (2 rows)
  // -----------------------------------------------
  const summaryGrid = html`<div class="summary-block"></div>`;
  const labelRow = html`<div class="summary-grid summary-label-row"></div>`;
  const mathRow = html`<div class="summary-grid summary-math-row"></div>`;

  // Top English alignment row: each item centered above corresponding symbol.
  const labelCells = [
    html`<div class="summary-cell word">${shapeCountWord}</div>`,
    html`<div class="summary-cell"></div>`,
    html`<div class="summary-cell word">${shapePlural[0].toUpperCase() + shapePlural.slice(1)}</div>`,
    html`<div class="summary-cell word">is</div>`,
    html`<div class="summary-cell word">${scaleValueWord}</div>`
  ];
  labelCells.forEach((cell) => labelRow.append(cell));

  // Bottom math row: 4 x shape = 8
  const mathCells = [
    html`<div class="summary-cell number"></div>`,
    html`<div class="summary-cell"></div>`,
    html`<div class="summary-cell"></div>`,
    html`<div class="summary-cell"></div>`,
    html`<div class="summary-cell number"></div>`
  ];
  mathCells[0].append(texToken(String(shapeCount), "number"));
  mathCells[1].append(texToken("\\times"));
  mathCells[2].append(makeShapeIcon({ type: shapeType, fill: shapeFill, size: 56 }));
  mathCells[3].append(texToken("="));
  mathCells[4].append(texToken(String(safeScaleValue), "number"));
  mathCells.forEach((cell) => mathRow.append(cell));

  summaryGrid.append(labelRow, mathRow);
  summaryWrap.append(summaryGrid);

  // ----------------------------------------------
  // Build expanded algebraic solution (hidden init)
  // ----------------------------------------------

  function makeNoteWithNumber(prefixText, numberText) {
    const note = html`<div class="algebra-note-col"></div>`;
    note.append(document.createTextNode(`${prefixText} `));
    note.append(html`<span class="note-number">${numberText}</span>`);
    return note;
  }

  function makeAlgebraRow(mainNode, noteNode = null) {
    const row = html`<div class="algebra-row"></div>`;
    const mainCol = html`<div class="algebra-main"></div>`;
    const marginCol = noteNode || html`<div class="algebra-note-col" aria-hidden="true"></div>`;
    mainCol.append(mainNode);
    row.append(mainCol, marginCol);
    return row;
  }

  const algebraGrid = html`<div class="algebra-grid"></div>`;

  // Step 1: count x shape = total
  const step1Line = html`<div class="algebra-line"></div>`;
  step1Line.append(
    texToken(String(shapeCount), "number"),
    texToken("\\times"),
    makeShapeIcon({ type: shapeType, fill: shapeFill, size: 58 }),
    texToken("="),
    texToken(String(safeScaleValue), "number")
  );
  algebraGrid.append(makeAlgebraRow(step1Line));

  // Step 2: divide both sides by count
  const divideWrap = html`<div class="divide-wrapper"></div>`;

  const leftFraction = html`<div class="fraction-cell"></div>`;
  const leftTop = html`<div class="fraction-top"></div>`;
  leftTop.append(
    texToken(String(shapeCount), "number"),
    texToken("\\times"),
    makeShapeIcon({ type: shapeType, fill: shapeFill, size: 50 })
  );
  const leftBottom = html`<div class="fraction-bottom number"></div>`;
  leftBottom.append(texToken(String(shapeCount), "number"));
  leftFraction.append(leftTop, leftBottom);

  const rightFraction = html`<div class="fraction-cell"></div>`;
  const rightTop = html`<div class="fraction-top number"></div>`;
  rightTop.append(texToken(String(safeScaleValue), "number"));
  const rightBottom = html`<div class="fraction-bottom number"></div>`;
  rightBottom.append(texToken(String(shapeCount), "number"));
  rightFraction.append(rightTop, rightBottom);

  divideWrap.append(leftFraction, texToken("="), rightFraction);
  algebraGrid.append(
    makeAlgebraRow(
      divideWrap,
      makeNoteWithNumber("divide both sides by", String(shapeCount))
    )
  );

  // Step 3: highlighted one shape + faded remainder = unit value
  const step3Line = html`<div class="algebra-line"></div>`;
  const step3Shapes = html`<div class="shape-row"></div>`;
  for (let i = 0; i < shapeCount; i += 1) {
    step3Shapes.append(
      makeShapeIcon({
        type: shapeType,
        fill: shapeFill,
        size: 56,
        faded: i !== 0
      })
    );
  }
  step3Line.append(step3Shapes, texToken("="), texToken(unitValueLatex, "number"));
  algebraGrid.append(makeAlgebraRow(step3Line));

  // Step 4: one shape = unit value
  const step4Line = html`<div class="algebra-line"></div>`;
  step4Line.append(
    makeShapeIcon({ type: shapeType, fill: shapeFill, size: 62 }),
    texToken("="),
    texToken(unitValueLatex, "number")
  );
  algebraGrid.append(
    makeAlgebraRow(
      step4Line,
      makeNoteWithNumber(`one ${shapeSingular} is equal to`, unitValueText)
    )
  );

  algebraWrap.append(algebraGrid);

  postCorrectWrap.append(summaryWrap, showAlgebraBtn, algebraWrap);

  root.append(questionEl, scaleWrap, answersWrap, checkBtn, postCorrectWrap);

  // -----------------------------------------------------------------
  // Public render API returned to the interaction cell.
  // Keeping this modular allows behavior changes without redraw logic.
  // -----------------------------------------------------------------
  return ({
    root,
    answerButtons,
    checkBtn,
    postCorrectWrap,
    summaryWrap,
    showAlgebraBtn,
    algebraWrap,
    icons: ICONS
  });
}
```

## 4) `interaction` cell

```js
interaction = {
  const ui = render;

  // -------------------------------------------
  // Interaction state model for this question UI
  // -------------------------------------------
  const state = {
    selectedIndex: null,
    mode: "idle", // idle | incorrect | correct
    locked: false,
    algebraShown: false
  };

  // Timer handle for sequential fade transition.
  let solutionFadeTimer = null;

  function clearFadeTimer() {
    if (solutionFadeTimer !== null) {
      clearTimeout(solutionFadeTimer);
      solutionFadeTimer = null;
    }
  }

  // -------------------------------------------------------------
  // Helper: fully clear answer visual states and feedback overlays
  // -------------------------------------------------------------
  function clearAnswerVisuals() {
    ui.answerButtons.forEach((btn) => {
      btn.classList.remove("is-selected", "is-correct", "is-incorrect", "is-locked");
      btn.setAttribute("aria-pressed", "false");

      const iconEl = btn.querySelector(".scale-answer-icon");
      iconEl.classList.remove("is-visible");
      iconEl.innerHTML = "";
    });
  }

  // ---------------------------------------------
  // Hide/reset everything in post-correct section
  // ---------------------------------------------
  function hidePostCorrectSection() {
    clearFadeTimer();

    ui.postCorrectWrap.classList.add("is-hidden");

    ui.summaryWrap.classList.remove("is-visible");

    ui.showAlgebraBtn.classList.remove("is-visible", "is-fading-out", "is-gone", "is-ready");
    ui.showAlgebraBtn.classList.add("is-dimmed");
    ui.showAlgebraBtn.disabled = true;

    ui.algebraWrap.classList.remove("is-visible");
    ui.algebraWrap.classList.add("is-hidden");

    state.algebraShown = false;
  }

  // ---------------------------------------------------------
  // Reveal summary + enabled solution button after correctness
  // ---------------------------------------------------------
  function showPostCorrectSection() {
    ui.postCorrectWrap.classList.remove("is-hidden");

    ui.showAlgebraBtn.classList.remove("is-fading-out", "is-gone", "is-dimmed");
    ui.showAlgebraBtn.classList.add("is-ready");
    ui.showAlgebraBtn.disabled = false;

    if (!state.algebraShown) {
      ui.algebraWrap.classList.add("is-hidden");
      ui.algebraWrap.classList.remove("is-visible");
    }

    // Trigger fade-in on next paint so transition is visible.
    requestAnimationFrame(() => {
      ui.summaryWrap.classList.add("is-visible");
      if (!state.algebraShown) {
        ui.showAlgebraBtn.classList.add("is-visible");
      }
    });
  }

  // ----------------------------------------------------
  // Helper: render state -> UI (single source of truth)
  // ----------------------------------------------------
  function updateUI() {
    clearAnswerVisuals();

    // LOCKED state (correct answer already found)
    if (state.mode === "correct") {
      const correctBtn = ui.answerButtons[state.selectedIndex];
      correctBtn.classList.add("is-correct", "is-locked");

      const iconEl = correctBtn.querySelector(".scale-answer-icon");
      iconEl.innerHTML = ui.icons.correct;
      iconEl.classList.add("is-visible");

      ui.answerButtons.forEach((btn) => {
        btn.disabled = true;
        btn.classList.add("is-locked");
      });

      ui.checkBtn.textContent = "Correct";
      ui.checkBtn.disabled = true;
      ui.checkBtn.classList.remove("is-dimmed", "is-ready");
      ui.checkBtn.classList.add("is-correct");

      // Only now do we reveal the teaching representation section.
      showPostCorrectSection();
      return;
    }

    // In non-locked states, answer buttons are always enabled.
    ui.answerButtons.forEach((btn) => {
      btn.disabled = false;
    });
    ui.checkBtn.classList.remove("is-correct");

    // Hide extra teaching section unless answer is correct.
    hidePostCorrectSection();

    // INCORRECT checked state: selected answer turns red with X icon.
    if (state.mode === "incorrect" && state.selectedIndex !== null) {
      const wrongBtn = ui.answerButtons[state.selectedIndex];
      wrongBtn.classList.add("is-incorrect");

      const iconEl = wrongBtn.querySelector(".scale-answer-icon");
      iconEl.innerHTML = ui.icons.incorrect;
      iconEl.classList.add("is-visible");

      ui.checkBtn.textContent = "Try Again";
      ui.checkBtn.disabled = false;
      ui.checkBtn.classList.remove("is-dimmed");
      ui.checkBtn.classList.add("is-ready");
      return;
    }

    // IDLE state with a current selection (pre-submission blue style).
    if (state.selectedIndex !== null) {
      const selectedBtn = ui.answerButtons[state.selectedIndex];
      selectedBtn.classList.add("is-selected");
      selectedBtn.setAttribute("aria-pressed", "true");

      ui.checkBtn.textContent = "Check";
      ui.checkBtn.disabled = false;
      ui.checkBtn.classList.remove("is-dimmed");
      ui.checkBtn.classList.add("is-ready");
      return;
    }

    // IDLE state with no selection: dimmed check button.
    ui.checkBtn.textContent = "Check";
    ui.checkBtn.disabled = true;
    ui.checkBtn.classList.add("is-dimmed");
    ui.checkBtn.classList.remove("is-ready");
  }

  // -----------------------------------------------------------
  // Click behavior for each answer button
  // - Correct state locks everything, so clicks are ignored there
  // - If currently in incorrect mode, selecting a new option resets
  //   back to pre-check state immediately (student can try again fast)
  // -----------------------------------------------------------
  ui.answerButtons.forEach((btn, index) => {
    btn.addEventListener("click", () => {
      if (state.locked) return;

      if (state.mode === "incorrect") {
        state.mode = "idle";
      }

      state.selectedIndex = index;
      updateUI();
    });
  });

  // ---------------------------------------
  // Check button behavior:
  // - In incorrect mode, button acts as reset
  // - Otherwise, it grades selected answer
  // ---------------------------------------
  ui.checkBtn.addEventListener("click", () => {
    if (state.mode === "correct") return;

    if (state.mode === "incorrect") {
      state.selectedIndex = null;
      state.mode = "idle";
      updateUI();
      return;
    }

    if (state.selectedIndex === null) return;

    const selectedAnswer = String(config.answerChoices[state.selectedIndex]);
    const isCorrect = selectedAnswer === String(config.correctAnswer);

    if (isCorrect) {
      state.mode = "correct";
      state.locked = true;
    } else {
      state.mode = "incorrect";
      state.locked = false;
    }

    updateUI();
  });

  // -------------------------------------------------------------
  // "show algebraic solution" behavior (sequential 1s fade total)
  // - 500ms button fade-out
  // - then 500ms algebra fade-in
  // -------------------------------------------------------------
  ui.showAlgebraBtn.addEventListener("click", () => {
    if (state.mode !== "correct") return;
    if (state.algebraShown) return;

    state.algebraShown = true;

    ui.showAlgebraBtn.disabled = true;
    ui.showAlgebraBtn.classList.remove("is-ready");
    ui.showAlgebraBtn.classList.add("is-fading-out");

    clearFadeTimer();
    solutionFadeTimer = setTimeout(() => {
      ui.showAlgebraBtn.classList.add("is-gone");

      ui.algebraWrap.classList.remove("is-hidden");
      requestAnimationFrame(() => {
        ui.algebraWrap.classList.add("is-visible");
      });

      solutionFadeTimer = null;
    }, 500);
  });

  // Render initial UI state.
  updateUI();

  // Return root DOM node so Observable displays this complete component.
  return ui.root;
}
```

## 5) display cell (optional but recommended)

```js
interaction
```
