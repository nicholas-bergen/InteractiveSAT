export type PageTransitionMode = "default" | "to-lesson" | "to-home";

interface RouterAction {
  (): void;
}

const ROOT_ATTR = "data-page-transition";
const ENTER_DURATION_MS = 220;

let transitionInFlight = false;
let clearTransitionTimer: number | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function navigateWithTransition(
  navigate: RouterAction,
  mode: PageTransitionMode = "default"
): Promise<void> {
  if (typeof window === "undefined") {
    navigate();
    return;
  }

  if (prefersReducedMotion()) {
    navigate();
    return;
  }

  if (transitionInFlight) {
    return;
  }

  transitionInFlight = true;

  if (clearTransitionTimer !== null) {
    window.clearTimeout(clearTransitionTimer);
    clearTransitionTimer = null;
  }

  const root = document.documentElement;
  root.setAttribute(ROOT_ATTR, mode);

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  try {
    navigate();
  } finally {
    clearTransitionTimer = window.setTimeout(() => {
      root.removeAttribute(ROOT_ATTR);
      transitionInFlight = false;
      clearTransitionTimer = null;
    }, ENTER_DURATION_MS);
  }
}
