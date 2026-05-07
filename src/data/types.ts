export interface Project {
  id: string;
  title: string;
  codename: string;
  role: string;
  year: number;
  stack: string[];
  description: string;
  github?: string;
  live?: string;
  posterPath: string;
  sceneId: string;
}

export interface ExperienceEntry {
  id: string;
  org: string;
  role: string;
  period: string;
  quarter: string;
  location: string;
  description: string;
  tags: string[];
  type: 'work' | 'award' | 'event';
}

export interface SkillItem {
  name: string;
  level: 'core' | 'proficient' | 'familiar';
}

export interface SkillCategory {
  id: string;
  label: string;
  colorToken: string;
  skills: SkillItem[];
}

export interface Operator {
  name: string;
  handle: string;
  role: string;
  institution: string;
  location: string;
  clearance: string;
  languages: string[];
  statement: string;
  bio:string
  email: string;
  github: string;
  linkedin: string;
}
