"use client";
import React, { useState, useEffect } from "react";

const CursorOverlay = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    requestAnimationFrame(() => {
      setPosition({ x: e.clientX, y: e.clientY });
    });
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="cursor"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    ></div>
  );
};

export default CursorOverlay;
