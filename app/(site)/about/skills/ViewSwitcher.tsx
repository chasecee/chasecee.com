"use client";

import React, { useState, useMemo } from "react";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import ListView from "./ListView";

const BubbleView = dynamic(() => import("./BubbleView"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <div className="opacity-60">Loading visualization...</div>
    </div>
  ),
  ssr: false,
});

const ViewToggleButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "rounded-md px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
    )}
  >
    {children}
  </button>
);

export default function ViewSwitcher() {
  const [viewMode, setViewMode] = useState<"list" | "bubble">("list");

  const toggleButtons = useMemo(
    () => (
      <div className="flex gap-1 rounded-lg bg-neutral-50 p-1 dark:bg-neutral-900">
        <ViewToggleButton
          active={viewMode === "list"}
          onClick={() => setViewMode("list")}
        >
          List View
        </ViewToggleButton>
        <ViewToggleButton
          active={viewMode === "bubble"}
          onClick={() => setViewMode("bubble")}
        >
          Bubble View
        </ViewToggleButton>
      </div>
    ),
    [viewMode],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="not-prose my-0 text-lg font-semibold">My Skillset</h3>
        {toggleButtons}
      </div>
      {viewMode === "list" ? <ListView /> : <BubbleView />}
    </div>
  );
}
