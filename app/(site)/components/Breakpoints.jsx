"use client";
import { useState, useEffect } from "react";

const ScreenSizeDisplay = () => {
  const [size, setSize] = useState("xs");

  const updateSize = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1280) {
        setSize("xl");
      } else if (window.innerWidth >= 1024) {
        setSize("lg");
      } else if (window.innerWidth >= 768) {
        setSize("md");
      } else if (window.innerWidth >= 640) {
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

  // Check if the current URL is not "https://chasecee.com" before rendering

  return (
    <div className="fixed left-0 top-0 p-1 text-[.8rem] opacity-10">{size}</div>
  );
};

export default ScreenSizeDisplay;
