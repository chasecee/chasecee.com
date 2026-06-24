"use client";

import React, { useState, useMemo, useCallback } from "react";
import { palette } from "@/src/components/palette";
import LucideIcon from "@/src/components/icons/LucideIcon";
import { LUCIDE_ICONS } from "@/src/components/icons/lucide";
import { useSkillsData } from "@/src/hooks/useSkillsData";
import type { Skill, SkillDotsProps } from "@/types";
import { getSkillCount, sortSkills } from "./utils";
import { ErrorDisplay } from "./ErrorDisplay";

const SkillDots: React.FC<SkillDotsProps> = ({ value, max = 10 }) => {
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

const ListView = () => {
  const { data: skillsData, error } = useSkillsData();
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((name: string) => {
    setOpenCategories((prev) => {
      const newCategories = new Set(prev);
      newCategories.has(name)
        ? newCategories.delete(name)
        : newCategories.add(name);
      return newCategories;
    });
  }, []);

  const renderSkillItem = useCallback(
    (skill: Skill, level = 0) => {
      const hasChildren = (skill.children?.length ?? 0) > 0;
      const isOpen = openCategories.has(skill.name);

      return (
        <div key={skill.name}>
          <div
            className={`flex items-center justify-between px-2 py-1.5 transition-all duration-200 ${
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

  const sortedCategories = useMemo(
    () => (skillsData?.children ? sortSkills([...skillsData.children]) : []),
    [skillsData?.children],
  );

  if (error) return <ErrorDisplay error={error} />;
  if (!skillsData?.children) return null;

  return (
    <div className="relative mx-auto overflow-hidden rounded-lg">
      <div className="py-2">
        <div>
          {sortedCategories.map((category) => renderSkillItem(category, 0))}
        </div>
      </div>
    </div>
  );
};

export default ListView;
