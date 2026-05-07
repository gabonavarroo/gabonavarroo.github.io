import type { ExperienceEntry } from './types';

export const EXPERIENCE: ExperienceEntry[] = [
  {
    id: 'cdas-intern',
    org: 'ITAM · CDAS',
    role: 'Software Engineer Intern',
    period: '2024 — Present',
    quarter: '2024.Q3',
    location: 'Mexico City, MX',
    description:
      'Nation-scale missing persons search platform. Built multi-container Kafka scheduler and distributed scrapers covering 32 Mexican states. 70k+ records ingested in real time.',
    tags: ['Python', 'Kafka', 'Docker', 'PostgreSQL', 'Scrapy'],
    type: 'work',
  },
  {
    id: 'coding-rush',
    org: 'ITAM',
    role: 'Coding Rush Organizer',
    period: '2023 — 2024',
    quarter: '2023.Q4',
    location: 'Mexico City, MX',
    description:
      'Designed and organized the ITAM Coding Rush competitive programming tournament. Authored problems, built the judge infrastructure, coordinated 120+ participants.',
    tags: ['Competitive Programming', 'Event Organization', 'Algorithm Design'],
    type: 'event',
  },
  {
    id: 'academic-excellence',
    org: 'ITAM',
    role: 'Academic Excellence Award',
    period: '2023',
    quarter: '2023.Q2',
    location: 'Mexico City, MX',
    description:
      'Awarded Academic Excellence for outstanding performance across Data Science and Computer Engineering coursework. Top of cohort.',
    tags: ['Academic', 'Data Science', 'Computer Engineering'],
    type: 'award',
  },
];
