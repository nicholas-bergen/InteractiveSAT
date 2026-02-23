# Observable Scale Prototype (Modular Cells)

Paste each block below into its own Observable cell, in order.

## 1) `config` cell

```js
config = ({
  // -------------------------------
  // Top-level lesson content fields
  // -------------------------------
  questionText: "What's the weight of one circle?",
  scaleDisplayText: "8",
  answerChoices: ["1", "2", "4", "8"],
  correctAnswer: "2",

  // ------------------------------------------
  // Student-facing status text (easy to change)
  // ------------------------------------------
  messages: {
    correct: "Correct!",
    incorrect: "Try again."
  },

  // -----------------------------------------------------------------
  // Shape groups are intentionally configurable for future question sets
  // - type: currently supports "circle", "square", "triangle"
  // - count: how many shapes in this group
  // - labels: optional text per shape (leave blank for now)
  // - fill: visual color per group
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
    --text-secondary: #4b5563;

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

  /* Optional visual state when answer is solved correctly */
  .scale-check-btn.is-correct {
    border-color: #a9dfbd;
    color: #1c8c44;
    background: #f4fbf6;
    box-shadow: none;
    cursor: default;
  }

  .scale-result-message {
    min-height: 28px;
    margin-top: 10px;
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    color: var(--text-secondary);
  }

  .scale-result-message.is-correct {
    color: #1d8f47;
  }

  .scale-result-message.is-incorrect {
    color: #bc2929;
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

    .scale-result-message {
      font-size: 20px;
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

  // ---------------------------------------
  // Helper: render one shape as an SVG node
  // ---------------------------------------
  function drawShape({ shape, cx, groundY, size }) {
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

    // Default behavior: circle (used in this prototype).
    const cy = groundY - size / 2;
    return svg`<g>
      <circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${fill}" stroke="#8ebc88" stroke-width="1.5"></circle>
      ${label ? svg`<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="18" font-weight="700" fill="#2a5a2a">${label}</text>` : null}
    </g>`;
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
    const groundY = 102; // Matches top edge of scale plate so shapes "sit" on it.
    const startCx = platformLeft + (platformWidth - shapeCount * diameter) / 2 + diameter / 2;

    shapes.forEach((shape, i) => {
      const cx = startCx + i * diameter;
      group.appendChild(drawShape({ shape, cx, groundY, size: diameter }));
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

  // -------------------------
  // Build static DOM skeleton
  // -------------------------
  const root = html`<section class="scale-quiz-root"></section>`;
  root.style.setProperty("--quiz-max-width", `${config.layout.maxWidth}px`);

  const questionEl = html`<h2 class="scale-quiz-question">${config.questionText}</h2>`;
  const scaleWrap = html`<div class="scale-quiz-scale-wrap"></div>`;
  const answersWrap = html`<div class="scale-quiz-answers"></div>`;
  const checkBtn = html`<button class="scale-check-btn is-dimmed" disabled>Check</button>`;
  const resultEl = html`<div class="scale-result-message" aria-live="polite"></div>`;

  // Build SVG scale illustration from config values.
  const shapes = expandShapeGroups(config.shapeGroups);
  const scaleSvg = buildScaleSvg(config.scaleDisplayText, shapes);
  scaleWrap.append(scaleSvg);

  // Build answer buttons (2x2 desktop; responsive collapse handled in CSS).
  const answerButtons = config.answerChoices.map((choiceText, index) => {
    const btn = html`<button class="scale-answer-btn" type="button" data-index="${index}" aria-pressed="false">
      <span>${choiceText}</span>
      <span class="scale-answer-icon" aria-hidden="true"></span>
    </button>`;

    answersWrap.append(btn);
    return btn;
  });

  root.append(questionEl, scaleWrap, answersWrap, checkBtn, resultEl);

  // -----------------------------------------------------------------
  // Public render API returned to the interaction cell.
  // Keeping this modular allows behavior changes without redraw logic.
  // -----------------------------------------------------------------
  return ({
    root,
    answerButtons,
    checkBtn,
    resultEl,
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
    locked: false
  };

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

  // ----------------------------------------------------
  // Helper: render state -> UI (single source of truth)
  // ----------------------------------------------------
  function updateUI() {
    clearAnswerVisuals();

    // Reset result text styles before applying current mode.
    ui.resultEl.classList.remove("is-correct", "is-incorrect");

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

      ui.resultEl.textContent = config.messages.correct;
      ui.resultEl.classList.add("is-correct");
      return;
    }

    // In non-locked states, answer buttons are always enabled.
    ui.answerButtons.forEach((btn) => {
      btn.disabled = false;
    });
    ui.checkBtn.classList.remove("is-correct");

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

      ui.resultEl.textContent = config.messages.incorrect;
      ui.resultEl.classList.add("is-incorrect");
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

      ui.resultEl.textContent = "";
      return;
    }

    // IDLE state with no selection: dimmed check button.
    ui.checkBtn.textContent = "Check";
    ui.checkBtn.disabled = true;
    ui.checkBtn.classList.add("is-dimmed");
    ui.checkBtn.classList.remove("is-ready");
    ui.resultEl.textContent = "";
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
