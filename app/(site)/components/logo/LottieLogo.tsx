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
      src="anim2.lottie"
      hover
      loop
      className="h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl"
    />
  );
}

export default App;
