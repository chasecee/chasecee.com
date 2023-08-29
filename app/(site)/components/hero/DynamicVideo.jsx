"use client";
import React, { useEffect, useRef } from "react";

const DynamicLoadVideo = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Load low-quality video initially
    videoRef.current.children[0].src = "/v/Stripe2_LowQuality.webm";
    videoRef.current.children[1].src = "/v/Stripe2_LowQuality.mp4";

    // Function to replace with high-quality video
    const loadHighQualityVideo = () => {
      videoRef.current.children[0].src = "/v/Stripe2_VP9.webm";
      videoRef.current.children[1].src = "/v/Stripe2_H.264.mp4";
      videoRef.current.load(); // Important to reload the video element
    };

    // Replace with high-quality video after page load
    window.addEventListener("load", loadHighQualityVideo);

    return () => {
      window.removeEventListener("load", loadHighQualityVideo);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 z-0 h-full w-full object-fill opacity-50"
      loop
      autoPlay={true}
      muted
      playsInline
    >
      <source type="video/webm" />
      <source type="video/mp4" />
    </video>
  );
};

export default DynamicLoadVideo;
