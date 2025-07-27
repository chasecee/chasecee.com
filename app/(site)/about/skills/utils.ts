import { Skill } from "@/types";

export const getSkillCount = (skill: Skill): number =>
  skill.children?.reduce(
    (sum: number, child: Skill) => sum + getSkillCount(child),
    0,
  ) ?? (skill.value ? 1 : 0);

export const sortSkills = (skills: Skill[]): Skill[] =>
  skills.sort((a, b) => {
    const aHasChildren = (a.children?.length ?? 0) > 0;
    const bHasChildren = (b.children?.length ?? 0) > 0;
    if (aHasChildren !== bHasChildren) return bHasChildren ? 1 : -1;
    return (b.value || 0) - (a.value || 0);
  });
