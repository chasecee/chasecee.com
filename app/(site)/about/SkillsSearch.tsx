"use client";

import React, { useState, useEffect } from "react";
import { palette } from "../components/palette";

interface Skill {
  name: string;
  value?: number;
  children?: Skill[];
}

interface SkillsData {
  name: string;
  children: Skill[];
}

interface SkillDotsProps {
  value: number;
  max?: number;
}

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
        const dotValue = i + 1;
        const isFilled = dotValue <= fullDots;

        return (
          <div
            key={i}
            className={`relative h-2 w-2 rounded-full ${
              isFilled ? "" : "bg-current opacity-20"
            }`}
            style={
              isFilled
                ? {
                    backgroundColor: getColor(i),
                  }
                : {}
            }
          />
        );
      })}
    </div>
  );
};

const SkillsTree = () => {
  const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/json/skills.json")
      .then((res) => res.json())
      .then(setSkillsData)
      .catch(console.error);
  }, []);

  const toggleCategory = (name: string) => {
    const newCategories = new Set(openCategories);
    newCategories.has(name)
      ? newCategories.delete(name)
      : newCategories.add(name);
    setOpenCategories(newCategories);
  };

  const getSkillCount = (skill: Skill): number =>
    skill.children
      ? skill.children.reduce((sum, child) => sum + getSkillCount(child), 0)
      : skill.value
        ? 1
        : 0;

  const renderSkillItem = (skill: Skill, level = 0) => {
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
          style={{ paddingLeft: hasChildren ? `${level * 16 + 8}px` : "60px" }}
          onClick={() => hasChildren && toggleCategory(skill.name)}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {hasChildren && (
              <svg
                className={`h-3 w-3 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
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
          <div className="flex flex-shrink-0 items-center gap-2">
            {skill.value && <SkillDots value={skill.value} />}
          </div>
        </div>
        {hasChildren && isOpen && (
          <div>
            {skill
              .children!.sort((a, b) => {
                const aHasChildren = (a.children?.length ?? 0) > 0;
                const bHasChildren = (b.children?.length ?? 0) > 0;
                if (aHasChildren !== bHasChildren) return bHasChildren ? 1 : -1;
                return (b.value || 0) - (a.value || 0);
              })
              .map((child) => renderSkillItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!skillsData)
    return (
      <div className="flex items-center justify-center p-8">
        <div className="opacity-60">Loading skills...</div>
      </div>
    );

  return (
    <div className="relative mx-auto overflow-hidden rounded-lg">
      <div className="py-4">
        <h3 className="not-prose my-0 text-lg font-semibold">My Skillset</h3>
      </div>

      <div className="py-2">
        <div>
          {skillsData.children.map((category) => renderSkillItem(category, 0))}
        </div>
      </div>
    </div>
  );
};

export default SkillsTree;
