'use client';

import { useState, useEffect } from 'react';

interface GitHubStats {
  totalCommits: number;
  contributionStreak: number;
  topLanguage: string;
  topRepos: string[];
  isLoading: boolean;
  error: string | null;
}

interface CachedStats {
  data: Omit<GitHubStats, 'isLoading' | 'error'>;
  timestamp: number;
}

const CACHE_KEY = 'gh_stats_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const GQL_QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
    repositories(first: 6, orderBy: { field: STARGAZERS, direction: DESC }, ownerAffiliations: OWNER) {
      nodes {
        name
        primaryLanguage { name }
      }
    }
  }
}
`;

function computeStreak(weeks: { contributionDays: { contributionCount: number; date: string }[] }[]): number {
  const days = weeks.flatMap((w) => w.contributionDays).reverse();
  let streak = 0;
  for (const day of days) {
    if (day.contributionCount > 0) streak++;
    else break;
  }
  return streak;
}

function pickTopLanguage(nodes: { primaryLanguage: { name: string } | null }[]): string {
  const freq: Record<string, number> = {};
  for (const repo of nodes) {
    const lang = repo.primaryLanguage?.name;
    if (lang) freq[lang] = (freq[lang] ?? 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Python';
}

export function useGitHubStats(): GitHubStats {
  const [state, setState] = useState<GitHubStats>({
    totalCommits: 0,
    contributionStreak: 0,
    topLanguage: '',
    topRepos: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function load() {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedStats = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            setState({ ...parsed.data, isLoading: false, error: null });
            return;
          }
        }

        const res = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: GQL_QUERY, variables: { login: 'gabonavarroo' } }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json.errors) throw new Error(json.errors[0]?.message ?? 'GraphQL error');

        const user = json.data?.user;
        if (!user) throw new Error('User not found');

        const cal = user.contributionsCollection.contributionCalendar;
        const repos = user.repositories.nodes as { name: string; primaryLanguage: { name: string } | null }[];

        const data = {
          totalCommits: cal.totalContributions as number,
          contributionStreak: computeStreak(cal.weeks),
          topLanguage: pickTopLanguage(repos),
          topRepos: repos.map((r: { name: string }) => r.name).slice(0, 4),
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
        setState({ ...data, isLoading: false, error: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setState((prev) => ({ ...prev, isLoading: false, error: msg }));
      }
    }

    load();
  }, []);

  return state;
}
