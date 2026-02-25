"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ComponentProps, MouseEvent } from "react";

import { navigateWithTransition, PageTransitionMode } from "@/lib/pageTransition";

type LinkComponentProps = ComponentProps<typeof Link>;

interface TransitionLinkProps extends Omit<LinkComponentProps, "href"> {
  href: string;
  transitionMode?: PageTransitionMode;
}

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}

export default function TransitionLink({
  href,
  onClick,
  target,
  transitionMode = "default",
  ...props
}: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.button !== 0 || isModifiedClick(event)) {
      return;
    }

    if (target && target !== "_self") {
      return;
    }

    event.preventDefault();
    void navigateWithTransition(() => router.push(href), transitionMode);
  };

  return <Link href={href} onClick={handleClick} target={target} {...props} />;
}
