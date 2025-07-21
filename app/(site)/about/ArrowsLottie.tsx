"use client";

import { useRef } from "react";
import "@aarsteinmedia/dotlottie-player";
import DotLottiePlayer from "@aarsteinmedia/dotlottie-player";

function App() {
  const animation = useRef<DotLottiePlayer | null>(null);
  const bounce = "bounce";
  return (
    <dotlottie-player
      ref={animation}
      src="arrows.lottie"
      autoplay
      className="pointer-events-none absolute bottom-[-10%] size-[4rem] rotate-60 overflow-hidden rounded-xl lg:-right-[31%] lg:bottom-2 lg:size-[8rem] lg:-rotate-30"
    />
  );
}

export default App;
