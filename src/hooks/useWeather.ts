'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  icon: string;
  isLoading: boolean;
  error: string | null;
}

interface CachedWeather {
  data: Omit<WeatherData, 'isLoading' | 'error'>;
  timestamp: number;
}

const CACHE_KEY = 'weather_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

export function useWeather(): WeatherData {
  const [state, setState] = useState<WeatherData>({
    temp: 0,
    condition: '',
    humidity: 0,
    icon: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;

    if (!key) {
      setState({ temp: 0, condition: '', humidity: 0, icon: '', isLoading: false, error: 'NO_KEY' });
      return;
    }

    async function load() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CachedWeather = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            setState({ ...parsed.data, isLoading: false, error: null });
            return;
          }
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=19.43&lon=-99.13&appid=${key}&units=metric`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const data = {
          temp: Math.round(json.main.temp as number),
          condition: (json.weather[0].description as string).toUpperCase(),
          humidity: json.main.humidity as number,
          icon: json.weather[0].icon as string,
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
