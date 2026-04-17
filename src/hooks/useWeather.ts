import { useEffect, useState } from 'react';

export interface WeatherSnapshot {
  city: string;
  tempC: number;
  description: string;
  icon: string; // OpenWeather icon code, e.g. "10d"
  /** Probability of precipitation today, 0–1 (max from 3-hour buckets) */
  rainProbability: number;
  /** Total expected mm of rain today */
  rainMm: number;
  fetchedAt: number;
}

interface OWForecastItem {
  pop?: number;
  rain?: { '3h'?: number };
  weather: { icon: string; description: string }[];
  main: { temp: number };
  dt_txt: string;
}

interface OWForecastResponse {
  list: OWForecastItem[];
  city: { name: string };
}

const OW_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

/**
 * Fetches today's weather summary for the given city from OpenWeatherMap.
 * Returns null while loading; sets `error` if anything failed.
 */
export function useWeather(city: string) {
  const [data, setData] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (!OW_KEY) {
      setError('missing-api-key');
      setLoading(false);
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )}&units=metric&lang=he&appid=${OW_KEY}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`OWM ${res.status}`);
        return (await res.json()) as OWForecastResponse;
      })
      .then((json) => {
        if (cancelled) return;
        // Look at next 24h (8 buckets of 3h)
        const today = json.list.slice(0, 8);
        const maxPop = today.reduce((m, x) => Math.max(m, x.pop ?? 0), 0);
        const totalRain = today.reduce((s, x) => s + (x.rain?.['3h'] ?? 0), 0);
        const first = today[0];
        setData({
          city: json.city.name,
          tempC: Math.round(first.main.temp),
          description: first.weather[0]?.description ?? '',
          icon: first.weather[0]?.icon ?? '01d',
          rainProbability: maxPop,
          rainMm: Math.round(totalRain * 10) / 10,
          fetchedAt: Date.now(),
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? 'weather-failed');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return { data, loading, error };
}
