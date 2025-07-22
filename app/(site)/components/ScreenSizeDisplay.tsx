"use client";
import { useState, useEffect } from "react";
import { BREAKPOINTS } from "../constants";

type BreakpointSize = "xs" | "sm" | "md" | "lg" | "xl";

const ScreenSizeDisplay: React.FC = () => {
  const [size, setSize] = useState<BreakpointSize>("xs");

  const updateSize = (): void => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;

      if (width >= BREAKPOINTS.DESKTOP) {
        setSize("xl");
      } else if (width >= BREAKPOINTS.TABLET) {
        setSize("lg");
      } else if (width >= BREAKPOINTS.MOBILE) {
        setSize("md");
      } else if (width >= 640) {
        setSize("sm");
      } else {
        setSize("xs");
      }
    }
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="fixed top-0 left-0 p-1 text-[.8rem] opacity-10">{size}</div>
  );
};

export default ScreenSizeDisplay;
