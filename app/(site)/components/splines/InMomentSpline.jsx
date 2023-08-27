"use client";
import Spline from "@splinetool/react-spline";

export default function App() {
  return (
    <Spline
      className="absolute inset-0 translate-y-1/2 transition-transform duration-200 group-hover:translate-y-[30%]"
      scene="https://prod.spline.design/k07IhAIEUaIDswER/scene.splinecode"
    />
  );
}
