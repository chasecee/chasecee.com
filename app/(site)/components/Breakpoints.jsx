"use client";
import { useState, useEffect } from "react";

const ScreenSizeDisplay = () => {
  const [size, setSize] = useState("xs");

  const updateSize = () => {
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
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="fixed left-0 top-0 p-1 text-[.8rem] opacity-0 hover:opacity-40">
      {size}
    </div>
  );
};

export default ScreenSizeDisplay;
