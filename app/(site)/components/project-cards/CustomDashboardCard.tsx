"use client";
import * as React from "react";
import Image from "next/image";
import { Project } from "@/types/Project";
import urlFor from "@/sanity/sanity.image";

const { useState, useEffect, useRef } = React;

type CustomDashboardCardProps = {
  project: Project;
  index: number;
};

export default function CustomDashboardCard({
  project,
  index,
}: CustomDashboardCardProps) {
  const [shouldLoadIframe, setShouldLoadIframe] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shouldLoadIframe) {
          setShouldLoadIframe(true);
        }
      },
      {
        root: null,
        rootMargin: "50px",
        threshold: 0.1,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [shouldLoadIframe]);

  return (
    <div
      className="aspect-square h-auto overflow-hidden rounded-xl bg-black"
      ref={containerRef}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl">
        {shouldLoadIframe ? (
          <iframe
            width="100%"
            height="100%"
            loading="lazy"
            src="https://pi-dashboard-one.vercel.app/"
            className="absolute inset-0 rounded-xl"
            style={{
              border: "none",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center opacity-60">
              <div className="mx-auto mb-2 h-8 w-8 animate-pulse rounded border-2 border-current" />
              <span className="text-sm">Loading preview...</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0"></div>
      </div>

      {project.svgcode?.code && (
        <div className="view-actor absolute inset-0 transition-transform delay-[25ms] duration-500 group-hover:-translate-y-[28%] group-hover:duration-300">
          <div
            className="svg-parent absolute top-1/2 left-1/2 h-full w-[50%] -translate-x-1/2 -translate-y-1/2 text-white"
            dangerouslySetInnerHTML={{
              __html: project.svgcode.code,
            }}
          />
        </div>
      )}
    </div>
  );
}
