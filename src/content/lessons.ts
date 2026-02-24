import { Lesson } from "@/lib/types";

// Start simple: this single file is your lesson "database".
// When content grows, you can split each lesson into its own file.
export const lessons: Lesson[] = [
  {
    id: "digital-scale-basics",
    title: "Digital Scale Basics",
    description: "Read static digital scale visuals and reason about shape values.",
    estimatedMinutes: 7,
    items: [
      {
        id: "digital-scale-basics-q1",
        type: "mcq",
        prompt: "How much is one square?",
        choices: ["2", "4", "6", "8"],
        answerIndex: 2,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 18,
            scaleDisplayText: "18",
            shapeGroups: [
              {
                type: "square",
                count: 3,
                labels: ["", "", ""],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [],
            layout: {
              maxWidth: 560
            }
          }
        }
      },
      {
        id: "digital-scale-basics-q2",
        type: "mcq",
        prompt: "What is n?",
        choices: ["5", "7", "10", "13"],
        answerIndex: 1,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 35,
            scaleDisplayText: "35",
            shapeGroups: [
              {
                type: "square",
                count: 5,
                labels: ["n", "n", "n", "n", "n"],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [],
            layout: {
              maxWidth: 560
            }
          }
        }
      },
      {
        id: "digital-scale-basics-q3",
        type: "mcq",
        prompt: "What equation represents this this situation?",
        choicesLatex: true,
        choices: ["24c = 24", "6c = 24", "4c = 40", "4c = 24"],
        answerIndex: 3,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 24,
            scaleDisplayText: "24",
            shapeGroups: [
              {
                type: "square",
                count: 4,
                labels: ["c", "c", "c", "c"],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [],
            layout: {
              maxWidth: 560
            }
          }
        }
      },
      {
        id: "digital-scale-basics-q4",
        type: "mcq",
        prompt: "How much is one square?",
        choices: ["2", "5", "8", "16"],
        answerIndex: 1,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 18,
            scaleDisplayText: "18",
            shapeGroups: [
              {
                type: "square",
                count: 2,
                labels: ["", ""],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [
              {
                count: 1,
                labels: ["8"],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        }
      },
      {
        id: "digital-scale-basics-q5",
        type: "mcq",
        prompt: "What is d?",
        choices: ["3", "5", "7", "11"],
        answerIndex: 0,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 14,
            scaleDisplayText: "14",
            shapeGroups: [
              {
                type: "square",
                count: 3,
                labels: ["d", "d", "d"],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [
              {
                count: 1,
                labels: ["5"],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        }
      },
      {
        id: "digital-scale-basics-q6",
        type: "mcq",
        prompt: "What equation represents this situation?",
        choicesLatex: true,
        choices: ["5k + 10 = 40", "5k = 50", "10k + 5 = 40", "40k + 10 = 50"],
        answerIndex: 0,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 40,
            scaleDisplayText: "40",
            shapeGroups: [
              {
                type: "square",
                count: 5,
                labels: ["k", "k", "k", "k", "k"],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [
              {
                count: 1,
                labels: ["10"],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        }
      },
      {
        id: "digital-scale-basics-q7-dragdrop-equation",
        type: "interactive",
        widget: "dragDropEquation",
        prompt: "Make an Equation that Represents this situation.",
        config: {
          pairedVisualWidget: {
            id: "singleDigitalScale",
            config: {
              scaleDisplayValue: 135,
              scaleDisplayText: "135",
              shapeGroups: [
                {
                  type: "square",
                  count: 1,
                  labels: [""],
                  fill: "#cce7c8"
                }
              ],
              weightGroups: [
                {
                  count: 1,
                  labels: ["45"],
                  fill: "#667286"
                }
              ],
              layout: {
                maxWidth: 560
              }
            }
          },
          tokens: [
            { kind: "slot", slotId: "left" },
            { kind: "text", value: "+" },
            { kind: "slot", slotId: "middle" },
            { kind: "text", value: "=" },
            { kind: "slot", slotId: "right" }
          ],
          pieces: [
            { id: "45", label: "45" },
            { id: "x", label: "x" },
            { id: "45x", label: "45x" },
            { id: "135", label: "135" },
            { id: "180", label: "180" }
          ],
          acceptedAnswers: [
            { left: "x", middle: "45", right: "135" },
            { left: "45", middle: "x", right: "135" }
          ],
          slotSize: 68
        }
      }
    ]
  },
  {
    id: "linear-equations",
    title: "Linear Equations Basics",
    description: "One-step and two-step equations with a balance-model intuition.",
    estimatedMinutes: 10,
    items: [
      {
        id: "solve-one-step",
        type: "mcq",
        prompt: "Solve for x: x + 4 = 11",
        choices: ["5", "6", "7", "8"],
        answerIndex: 2,
        hint: "Subtract 4 from both sides.",
        explanation: "x + 4 = 11 becomes x = 7 after subtracting 4 from each side."
      },
      {
        id: "balance-intuition",
        type: "interactive",
        prompt: "Look at the scale and choose which side is heavier.",
        widget: "balanceScale",
        config: {
          leftMass: 5,
          rightMass: 8
        },
        expectedState: "right_heavier",
        hint: "Compare the two masses directly: 8 is greater than 5.",
        explanation: "The right side is heavier because it has mass 8, which exceeds 5."
      },
      {
        id: "solve-two-step",
        type: "freeResponse",
        prompt: "Solve for x: 2x = 18",
        acceptableAnswers: ["9", "x=9", "x = 9"],
        placeholder: "Type your answer, e.g. 9",
        hint: "Divide both sides by 2.",
        explanation: "2x = 18 becomes x = 9 after dividing each side by 2."
      }
    ]
  },
  {
    id: "fractions-intro",
    title: "Fractions Intro",
    description: "Quick checks on fraction value and equivalence.",
    estimatedMinutes: 8,
    items: [
      {
        id: "fraction-value",
        type: "mcq",
        prompt: "Which fraction is equal to 1/2?",
        choices: ["2/3", "3/6", "4/5", "5/6"],
        answerIndex: 1,
        hint: "Try reducing or expanding each fraction.",
        explanation: "3/6 simplifies to 1/2 after dividing numerator and denominator by 3."
      },
      {
        id: "decimal-match",
        type: "freeResponse",
        prompt: "Write 1/4 as a decimal.",
        acceptableAnswers: ["0.25", ".25"],
        placeholder: "Type your answer, e.g. 0.25",
        hint: "Think about quarter dollars.",
        explanation: "One quarter equals twenty-five hundredths: 0.25."
      }
    ]
  }
];
