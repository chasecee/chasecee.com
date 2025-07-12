"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const AnimatedHeroText = () => {
  const [intersectionRatio, setIntersectionRatio] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIntersectionRatio(entry.intersectionRatio);
        });
      },
      {
        threshold: Array.from({ length: 101 }, (_, i) => i / 100), // 0 to 1 in steps of 0.01
        rootMargin: "0px",
      },
    );

    // Wait for next tick to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const sentinel = document.getElementById("hero-sentinel");
      if (sentinel) {
        observer.observe(sentinel);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isMounted]);

  // Calculate scale, opacity, and translateY based on intersection ratio
  const scale = 0.78 + intersectionRatio * 0.3; // Scale from 0.78 to 1.08
  const opacity = intersectionRatio; // Fade from 0 to 1
  const translateY = (1 - intersectionRatio) * -200; // Move up 50px when not visible

  // Prevent rendering until mounted to avoid SSR issues
  if (!isMounted) {
    return (
      <>
        <div className="pointer-events-none relative z-10 mx-auto flex w-full touch-none flex-col items-center justify-center gap-5 py-10 text-center select-none lg:max-w-2/3">
          <h1 className="text-4xl font-semibold text-pretty text-gray-900 md:text-5xl dark:text-white">
            Let&apos;s build.
          </h1>
          <div className="container flex flex-col gap-8">
            <p className="text-lg font-light text-pretty text-gray-600 md:text-xl dark:text-gray-300">
              I&apos;m Chase, a developer obsessed with
              <br className="hidden sm:block" />
              &nbsp; crafting excellent experiences.
            </p>
            <div className="pointer-events-auto hidden flex-col flex-wrap items-center justify-center gap-3 md:flex-row">
              <Link
                href="/contact"
                className="pointer-events-auto flex-grow rounded-lg bg-black px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-100"
              >
                Get Started
              </Link>
              <Link
                href="/about"
                className="pointer-events-auto flex-grow rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="pointer-events-none relative z-10 mx-auto flex w-full touch-none flex-col items-center justify-center gap-5 py-10 text-center select-none lg:max-w-2/3"
      style={{
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity: opacity,
        transition: "0.1s transform ease, 0.1s opacity ease",
      }}
    >
      <h1 className="text-5xl font-semibold text-pretty text-gray-900 md:text-6xl dark:text-white">
        Let&apos;s build.
      </h1>
      <div className="container flex flex-col gap-8">
        <p className="text-lg font-light text-pretty text-gray-600 md:text-xl dark:text-gray-300">
          I&apos;m Chase, a developer obsessed with
          <br className="hidden sm:block" />
          &nbsp;crafting excellent experiences.
        </p>
        <div className="pointer-events-auto hidden flex-col flex-wrap items-center justify-center gap-3 md:flex-row">
          <Link
            href="/contact"
            className="pointer-events-auto flex-grow rounded-lg bg-black px-6 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-gray-800 hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="pointer-events-auto flex-grow rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-center text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnimatedHeroText;
