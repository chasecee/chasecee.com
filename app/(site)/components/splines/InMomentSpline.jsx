"use client";
import Spline from "@splinetool/react-spline";

export default function App() {
  return (
    <Spline
      className="spline3d absolute inset-0 origin-[60%_0%] translate-y-1/2 scale-125 transition-transform duration-200 md:group-hover:translate-y-[30%]"
      scene="https://prod.spline.design/k07IhAIEUaIDswER/scene.splinecode"
    />
  );
}
