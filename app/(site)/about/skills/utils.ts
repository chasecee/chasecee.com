import { Skill } from "../../types/skills";

export const getSkillCount = (skill: Skill): number =>
  skill.children?.reduce((sum, child) => sum + getSkillCount(child), 0) ??
  (skill.value ? 1 : 0);

export const sortSkills = (skills: Skill[]): Skill[] =>
  skills.sort((a, b) => {
    const aHasChildren = (a.children?.length ?? 0) > 0;
    const bHasChildren = (b.children?.length ?? 0) > 0;
    if (aHasChildren !== bHasChildren) return bHasChildren ? 1 : -1;
    return (b.value || 0) - (a.value || 0);
  });

export const wrapText = (text: string, radius: number): string[] => {
  const words = text.split(/\s+/);
  const maxWidth = radius * 1.5;
  const maxLines = Math.max(1, Math.floor(radius / 12));

  if (words.length === 1) return [text];

  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + " " + words[i];
    const estimatedWidth = testLine.length * (radius / 8);

    if (estimatedWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = words[i];
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
};
