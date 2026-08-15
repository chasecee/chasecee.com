"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { palette } from "@/src/components/palette";
import LucideIcon from "@/src/components/icons/LucideIcon";
import { LUCIDE_ICONS } from "@/src/components/icons/lucide";
import type { Skill, SkillDotsProps } from "@/types";
import { getSkillCount, sortSkills } from "./utils";

const SkillDots = ({ value, max = 10 }: SkillDotsProps) => {
  const normalizedValue = (value / max) * 5;
  const fullDots = Math.ceil(normalizedValue);
  const getColor = () => {
    const greenIndex = Math.min(Math.max(value - 1, 0), 7);
    return palette.green[greenIndex];
  };

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`Proficiency ${value} out of ${max}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i + 1 <= fullDots;
        return (
          <div
            key={i}
            aria-hidden="true"
            className={`relative h-2 w-2 rounded-full ${isFilled ? "" : "bg-current opacity-20"}`}
            style={isFilled ? { backgroundColor: getColor() } : {}}
          />
        );
      })}
    </div>
  );
};

type ListViewProps = {
  skills: Skill;
};

const rowClass = "flex items-center justify-between px-2 py-1.5";

const ListView = ({ skills }: ListViewProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const panelIdBase = useId();

  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }, []);

  const renderSkillItem = useCallback(
    (skill: Skill, level = 0) => {
      const hasChildren = (skill.children?.length ?? 0) > 0;
      const isOpen = openCategories.has(skill.name);
      const panelId = `${panelIdBase}-${skill.name.replace(/\W+/g, "-")}`;

      const label = (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {hasChildren && (
            <LucideIcon
              icon={LUCIDE_ICONS.chevronRight}
              size={12}
              className={`opacity-60 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
            />
          )}
          <span
            className={`truncate text-sm ${hasChildren ? "font-medium" : "opacity-90"}`}
          >
            {skill.name}
          </span>
          {hasChildren && (
            <span className="text-xs opacity-60">{getSkillCount(skill)}</span>
          )}
        </div>
      );

      const trailing = (
        <div className="flex shrink-0 items-center gap-2">
          {skill.value && <SkillDots value={skill.value} />}
        </div>
      );

      return (
        <div key={skill.name}>
          {hasChildren ? (
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleCategory(skill.name)}
              className={`${rowClass} focus-ring w-full cursor-pointer text-left transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-800`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {label}
              {trailing}
            </button>
          ) : (
            <div className={rowClass} style={{ paddingLeft: "60px" }}>
              {label}
              {trailing}
            </div>
          )}
          {hasChildren && (
            <div
              id={panelId}
              // `inert` keeps the collapsed rows out of the tab order and the
              // accessibility tree while still allowing the height animation.
              inert={!isOpen}
              className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                {sortSkills(skill.children!).map((child) =>
                  renderSkillItem(child, level + 1),
                )}
              </div>
            </div>
          )}
        </div>
      );
    },
    [openCategories, toggleCategory, panelIdBase],
  );

  const sortedCategories = useMemo(
    () => (skills.children ? sortSkills([...skills.children]) : []),
    [skills.children],
  );

  if (sortedCategories.length === 0) return null;

  return (
    <div className="py-1">
      {sortedCategories.map((category) => renderSkillItem(category, 0))}
    </div>
  );
};

export default ListView;
