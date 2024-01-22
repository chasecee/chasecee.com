"use client";

import { useRef } from "react";
import "@aarsteinmedia/dotlottie-player";
import type { DotLottiePlayer } from "@aarsteinmedia/dotlottie-player";

function App() {
  const animation = useRef<DotLottiePlayer | null>(null);
  const bounce = "bounce";
  return (
    <dotlottie-player
      ref={animation}
      src="wavyline.lottie"
      autoplay
      loop
      className="h-[19.5px] overflow-hidden"
    />
  );
}

export default App;
