import { startTransition, useId, useState } from "react";
import type { Skill } from "@/types";
import ListView from "./ListView";
import { sortSkills } from "./utils";

export default function ViewSwitcher({ skills }: { skills: Skill }) {
  const reactId = useId();
  const [categories] = useState(() =>
    sortSkills([...(skills.children ?? [])]),
  );
  const [activeName, setActiveName] = useState(categories[0]?.name ?? null);
  const active =
    categories.find((category) => category.name === activeName) ?? categories[0];

  if (!active) return null;

  return (
    <div className="measure">
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
