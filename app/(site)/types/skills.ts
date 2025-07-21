export interface Skill {
  name: string;
  value?: number;
  children?: Skill[];
}

export interface SkillDotsProps {
  value: number;
  max?: number;
}
