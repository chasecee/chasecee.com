"use client";

import { useEffect } from "react";
import { loadDotLottiePlayer } from "@/src/lib/loadDotLottiePlayer";

export default function WavyLine() {
  useEffect(() => {
    void loadDotLottiePlayer();
  }, []);

  return (
    <dotlottie-player
      src="/wavyline.lottie"
      autoplay
      loop
      className="h-20 w-full max-w-md"
    />
  );
}
