import type { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: 'PROJECT_04.01',
    title: 'CDAS — Amber Alert Platform',
    codename: 'BÚSQUEDA COLECTIVA',
    role: 'Software Engineer Intern',
    year: 2024,
    stack: ['Python', 'Kafka', 'Docker', 'PostgreSQL', 'Scrapy'],
    description:
      'Nation-scale missing persons platform. 70k+ records. Real-time distributed scraping pipeline across 32 Mexican states.',
    github: 'https://github.com/gabonavarroo',
    posterPath: '/posters/cdas.png',
    sceneId: 'cdas',
  },
  {
    id: 'PROJECT_04.02',
    title: 'Faultmap — LLM Diagnostic Library',
    codename: 'FAILURE SLICE DETECTION',
    role: 'Author & Maintainer',
    year: 2024,
    stack: ['Python', 'HuggingFace', 'PyTorch', 'HDBSCAN', 'PyPI'],
    description:
      'Open-source LLM evaluation library. Clusters embedding failures, detects systematic model weaknesses. Published on PyPI.',
    github: 'https://github.com/gabonavarroo/faultmap',
    posterPath: '/posters/faultmap.png',
    sceneId: 'faultmap',
  },
  {
    id: 'PROJECT_04.03',
    title: 'Pharmacy Network Optimization',
    codename: 'P-MEDIAN SOLVER',
    role: 'Lead Engineer',
    year: 2024,
    stack: ['Python', 'OR-Tools', 'GeoPandas', 'PostgreSQL', 'NetworkX'],
    description:
      'Facility location optimization across Mexico. P-median model placing 47 pharmacy sites to maximize population coverage.',
    posterPath: '/posters/pharmacy.png',
    sceneId: 'pharmacy',
  },
  {
    id: 'PROJECT_04.04',
    title: 'E-Commerce Data Pipeline',
    codename: 'AKAMAI BYPASS ACTIVE',
    role: 'Data Engineer',
    year: 2023,
    stack: ['Python', 'Selenium', 'Kafka', 'MongoDB', 'Docker'],
    description:
      'Anti-bot bypass pipeline for large-scale e-commerce price intelligence. 99.7% uptime via rotating proxy fallback.',
    posterPath: '/posters/pipeline.png',
    sceneId: 'pipeline',
  },
  {
    id: 'PROJECT_04.05',
    title: 'InsuLink — Diabetes Care Platform',
    codename: 'INSULINK PLATFORM',
    role: 'Full-Stack Engineer',
    year: 2023,
    stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'EmailJS'],
    description:
      'Patient-doctor matching platform for insulin-dependent patients. 70+ users, consultation booking, secure messaging.',
    posterPath: '/posters/insulink.png',
    sceneId: 'insulink',
  },
  {
    id: 'PROJECT_04.06',
    title: 'Genetic Algorithm CO₂ Estimation',
    codename: 'GA OPTIMIZER',
    role: 'Researcher',
    year: 2023,
    stack: ['Python', 'NumPy', 'Matplotlib', 'SciPy'],
    description:
      'GA-driven curve fitting on historical atmospheric CO₂ data. Achieved R²=0.95 convergence in 342 generations.',
    posterPath: '/posters/genetic.png',
    sceneId: 'genetic',
  },
  {
    id: 'PROJECT_04.07',
    title: 'Wordle Optimization',
    codename: 'ENTROPY-OPTIMAL',
    role: '1st Place — ITAM Tournament',
    year: 2023,
    stack: ['Python', 'Information Theory', 'Decision Trees'],
    description:
      'Entropy-optimal Wordle solver. Won 1st place at ITAM Coding Rush tournament. Average solve in 3.42 guesses.',
    github: 'https://github.com/gabonavarroo',
    posterPath: '/posters/wordle.png',
    sceneId: 'wordle',
  },
  {
    id: 'PROJECT_04.08',
    title: 'Options Flow Monitor',
    codename: 'LIVE OPTIONS FLOW',
    role: 'Quant Developer',
    year: 2024,
    stack: ['Python', 'FastAPI', 'WebSockets', 'Three.js', 'React'],
    description:
      'Real-time options flow terminal. 3D volatility surface rendering, sub-50ms latency simulation, unusual activity alerts.',
    posterPath: '/posters/options.png',
    sceneId: 'options',
  },
];
