"use client";

import { useEffect } from "react";
import { loadDotLottiePlayer } from "@/src/lib/loadDotLottiePlayer";

interface ArrowsLottieProps {
  className?: string;
}

export default function ArrowsLottie({ className }: ArrowsLottieProps) {
  useEffect(() => {
    void loadDotLottiePlayer();
  }, []);

  const defaultClassName =
    "pointer-events-none absolute bottom-[-10%] size-[4rem] rotate-60 overflow-hidden rounded-xl lg:-right-[31%] lg:bottom-2 lg:size-[8rem] lg:-rotate-30";

  return (
    <dotlottie-player
      src="/arrows.lottie"
      autoplay
      loop
      className={className ?? defaultClassName}
    />
  );
}
