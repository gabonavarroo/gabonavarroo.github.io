import type { SkillCategory } from './types';

export const SKILLS: SkillCategory[] = [
  {
    id: 'ml-ai',
    label: 'ML / AI',
    colorToken: '--cyan-pure',
    skills: [
      { name: 'PyTorch', level: 'core' },
      { name: 'HuggingFace', level: 'core' },
      { name: 'scikit-learn', level: 'core' },
      { name: 'LLM Evaluation', level: 'core' },
      { name: 'HDBSCAN', level: 'proficient' },
      { name: 'Causal Inference', level: 'proficient' },
      { name: 'Computer Vision', level: 'familiar' },
    ],
  },
  {
    id: 'data-engineering',
    label: 'Data Engineering',
    colorToken: '--blue-electric',
    skills: [
      { name: 'Kafka', level: 'core' },
      { name: 'PostgreSQL', level: 'core' },
      { name: 'MongoDB', level: 'proficient' },
      { name: 'Scrapy', level: 'core' },
      { name: 'Pandas', level: 'core' },
      { name: 'dbt', level: 'familiar' },
      { name: 'Airflow', level: 'familiar' },
    ],
  },
  {
    id: 'systems-infra',
    label: 'Systems & Infra',
    colorToken: '--system-green',
    skills: [
      { name: 'Docker', level: 'core' },
      { name: 'Linux', level: 'core' },
      { name: 'FastAPI', level: 'proficient' },
      { name: 'GitHub Actions', level: 'proficient' },
      { name: 'Kubernetes', level: 'familiar' },
      { name: 'Redis', level: 'familiar' },
    ],
  },
  {
    id: 'algorithms',
    label: 'Algorithms',
    colorToken: '--data-gold',
    skills: [
      { name: 'Optimization', level: 'core' },
      { name: 'Genetic Algorithms', level: 'core' },
      { name: 'Graph Theory', level: 'proficient' },
      { name: 'OR-Tools', level: 'proficient' },
      { name: 'Information Theory', level: 'proficient' },
      { name: 'Competitive Programming', level: 'proficient' },
    ],
  },
  {
    id: 'web-fullstack',
    label: 'Web & Full-Stack',
    colorToken: '--bio-teal',
    skills: [
      { name: 'Next.js', level: 'core' },
      { name: 'TypeScript', level: 'core' },
      { name: 'React', level: 'core' },
      { name: 'Three.js / R3F', level: 'proficient' },
      { name: 'GSAP', level: 'proficient' },
      { name: 'Tailwind CSS', level: 'core' },
      { name: 'WebGL / GLSL', level: 'proficient' },
    ],
  },
];
