"use client";

import { startTransition, useId, useMemo, useState } from "react";
import { useSkillsData } from "@/src/hooks/useSkillsData";
import ListView from "./ListView";
import { ErrorDisplay } from "./ErrorDisplay";
import { sortSkills } from "./utils";

export default function ViewSwitcher() {
  const { data: skillsData, error } = useSkillsData();
  const reactId = useId();
  const categories = useMemo(
    () => (skillsData?.children ? sortSkills([...skillsData.children]) : []),
    [skillsData?.children],
  );
  const [activeName, setActiveName] = useState<string | null>(null);
  const active =
    categories.find((category) => category.name === activeName) ?? categories[0];

  if (error) return <ErrorDisplay error={error} />;
  if (!active) return null;

  return (
    <div className="mx-auto w-full" style={{ maxWidth: "min(var(--prose-measure), 100%)" }}>
      <h3>My Skillset</h3>
      <div className="not-prose">
        {categories.length > 1 && (
          <div
            role="tablist"
            aria-label="Skill categories"
            className="mb-4 flex flex-wrap gap-x-5 gap-y-2 border-b border-current/15"
          >
            {categories.map((category) => {
              const selected = category.name === active.name;
              return (
                <button
                  key={category.name}
                  type="button"
                  role="tab"
                  id={`${reactId}-${category.name}`}
                  aria-selected={selected}
                  aria-controls={`${reactId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  className={`-mb-px border-b pb-2 text-sm tracking-wide transition-colors ${
                    selected
                      ? "border-current text-current"
                      : "border-transparent text-current/45 hover:text-current/75"
                  }`}
                  onClick={() => {
                    startTransition(() => setActiveName(category.name));
                  }}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
        <div
          role="tabpanel"
          id={`${reactId}-panel`}
          aria-labelledby={`${reactId}-${active.name}`}
        >
          <ListView key={active.name} category={active} />
        </div>
      </div>
    </div>
  );
}
