"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type RandomNoteButtonProps = {
  className?: string;
  hrefs: string[];
};

export function RandomNoteButton({
  className = "",
  hrefs,
}: RandomNoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={className}
      disabled={!hrefs.length || isPending}
      onClick={() => {
        if (!hrefs.length) {
          return;
        }

        const nextHref = hrefs[Math.floor(Math.random() * hrefs.length)];
        startTransition(() => {
          router.push(nextHref);
        });
      }}
      type="button"
    >
      Random
    </button>
  );
}
