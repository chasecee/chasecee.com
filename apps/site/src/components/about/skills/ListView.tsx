"use client";

import { useState, useMemo, useCallback } from "react";
import { palette } from "@/src/components/palette";
import LucideIcon from "@/src/components/icons/LucideIcon";
import { LUCIDE_ICONS } from "@/src/components/icons/lucide";
import type { Skill, SkillDotsProps } from "@/types";
import { getSkillCount, sortSkills } from "./utils";

const SkillDots = ({ value, max = 10 }: SkillDotsProps) => {
  const normalizedValue = (value / max) * 5;
  const fullDots = Math.ceil(normalizedValue);
  const getColor = (dotIndex: number) => {
    const greenIndex = Math.min(Math.max(value - 1, 0), 7);
    return palette.green[greenIndex];
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i + 1 <= fullDots;
        return (
          <div
            key={i}
            className={`relative h-2 w-2 rounded-full ${isFilled ? "" : "bg-current opacity-20"}`}
            style={isFilled ? { backgroundColor: getColor(i) } : {}}
          />
        );
      })}
    </div>
  );
};

type ListViewProps = {
  category: Skill;
};

const ListView = ({ category }: ListViewProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

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

      return (
        <div key={skill.name}>
          <div
            className={`flex items-center justify-between px-2 py-1.5 transition-colors ${
              hasChildren
                ? "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                : ""
            }`}
            style={{
              paddingLeft: hasChildren ? `${level * 16 + 8}px` : "60px",
            }}
            onClick={() => hasChildren && toggleCategory(skill.name)}
          >
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
                <span className="text-xs opacity-60">
                  {getSkillCount(skill)}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {skill.value && <SkillDots value={skill.value} />}
            </div>
          </div>
          {hasChildren && isOpen && (
            <div>
              {sortSkills(skill.children!).map((child) =>
                renderSkillItem(child, level + 1),
              )}
            </div>
          )}
        </div>
      );
    },
    [openCategories, toggleCategory],
  );

  const items = useMemo(
    () => (category.children ? sortSkills([...category.children]) : []),
    [category.children],
  );

  if (items.length === 0) return null;

  return (
    <div className="py-1">
      {items.map((skill) => renderSkillItem(skill, 0))}
    </div>
  );
};

export default ListView;
