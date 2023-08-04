"use client";

import { useRef } from "react";
import "@johanaarstein/dotlottie-player";
import type { DotLottiePlayer } from "@johanaarstein/dotlottie-player";

function App() {
  const animation = useRef<DotLottiePlayer | null>(null);
  return (
    <dotlottie-player
      ref={animation}
      src="anim.lottie"
      autoplay
      class="overflow-hidden rounded-xl"
    />
  );
}

export default App;
