"use client";

import dynamic from "next/dynamic";

const WavyLine = dynamic(() => import("./WavyLine"), {
  ssr: false,
  loading: () => null,
});

export default WavyLine;
