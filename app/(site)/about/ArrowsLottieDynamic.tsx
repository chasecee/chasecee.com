"use client";

import dynamic from "next/dynamic";

const ArrowsLottie = dynamic(() => import("./ArrowsLottie"), {
  ssr: false,
  loading: () => null,
});

export default ArrowsLottie;
