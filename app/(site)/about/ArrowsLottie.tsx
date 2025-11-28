"use client";

import "@aarsteinmedia/dotlottie-player";

export default function ArrowsLottie() {
  return (
    <dotlottie-player
      src="arrows.lottie"
      autoplay
      className="pointer-events-none absolute bottom-[-10%] size-[4rem] rotate-60 overflow-hidden rounded-xl lg:-right-[31%] lg:bottom-2 lg:size-[8rem] lg:-rotate-30"
    />
  );
}
