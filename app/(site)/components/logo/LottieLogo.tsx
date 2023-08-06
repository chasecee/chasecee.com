"use client";

import { useRef } from "react";
import "@johanaarstein/dotlottie-player";
import type { DotLottiePlayer } from "@johanaarstein/dotlottie-player";

function App() {
  const animation = useRef<DotLottiePlayer | null>(null);
  const bounce = "bounce";
  return (
    <dotlottie-player
      ref={animation}
      src="anim2.lottie"
      hover
      loop
      class="h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl"
    />
  );
}

export default App;