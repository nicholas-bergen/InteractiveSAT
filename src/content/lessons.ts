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
        id: "QB-LinearEquationsInOneVariable-1.1-Step0.1.1",
        type: "mcq",
        prompt: "How much does one square weigh?",
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
            weightGroups: [
              {
                count: 0,
                labels: [""],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        },
      },
            {
        id: "QB-LinearEquationsInOneVariable-1.1-Step0.1.2",
        type: "mcq",
        prompt: "How much does n weigh?",
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
                labels: ["n", "n", "n"],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [
              {
                count: 0,
                labels: [""],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        },
        satQuestion: {
          prompt: "What value of n satisfies the equation",
          mathLatex: "3n = 18",
          choices: ["2", "4", "6", "8"],
          answerIndex: 2
        }
      },
            {
        id: "QB-LinearEquationsInOneVariable-1.1-Step0.2.1",
        type: "mcq",
        prompt: "How much does one square weigh?",
        choices: ["4", "5", "8", "20"],
        answerIndex: 0,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 28,
            scaleDisplayText: "28",
            shapeGroups: [
              {
                type: "square",
                count: 5,
                labels: ["", "", ""],
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
        },
      },
            {
        id: "QB-LinearEquationsInOneVariable-1.1-Step0.2.2",
        type: "mcq",
        prompt: "How much does k weigh?",
        choices: ["4", "5", "8", "20"],
        answerIndex: 0,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 28,
            scaleDisplayText: "28",
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
                labels: ["8"],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        },
        satQuestion: {
          prompt: "What value of k satisfies the equation",
          mathLatex: "5k + 8 = 28",
          choices: ["4", "5", "8", "20"],
          answerIndex: 0
        }
      },
            {
        id: "QB-LinearEquationsInOneVariable-1.1",
        type: "mcq",
        prompt: "How much does one square weigh?",
        choices: ["11", "80", "96", "704"],
        answerIndex: 0,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 88,
            scaleDisplayText: "88",
            shapeGroups: [
              {
                type: "square",
                count: 8,
                labels: ["", "", "", "", "", "", "", ""],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [
              {
                count: 0,
                labels: [""],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        },
        satQuestion: {
          prompt: "What value of p satisfies the equation",
          mathLatex: "8x = 88",
          choices: ["11", "80", "96", "704"],
          answerIndex: 0
        }
      },
            {
        id: "QB-LinearEquationsInOneVariable-1.1",
        type: "mcq",
        prompt: "How much does one square weigh?",
        choices: ["14", "65", "86", "250"],
        answerIndex: 0,
        visualWidget: {
          id: "singleDigitalScale",
          config: {
            scaleDisplayValue: 250,
            scaleDisplayText: "250",
            shapeGroups: [
              {
                type: "square",
                count: 5,
                labels: ["", "", "", "", ""],
                fill: "#cce7c8"
              }
            ],
            weightGroups: [
              {
                count: 1,
                labels: ["180"],
                fill: "#667286"
              }
            ],
            layout: {
              maxWidth: 560
            }
          }
        },
        satQuestion: {
          prompt: "What value of p satisfies the equation",
          mathLatex: "5p + 180 = 250",
          choices: ["14", "65", "86", "250"],
          answerIndex: 0
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
