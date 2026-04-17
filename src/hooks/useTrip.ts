import { useEffect, useState, useCallback } from 'react';
import type { Trip } from '@/types/trip';
import { SEED_TRIP } from '@/data/seedTrip';

const STORAGE_KEY = 'shickotours.trip.v1';

export function useTrip() {
  const [trip, setTripState] = useState<Trip>(() => {
    if (typeof window === 'undefined') return SEED_TRIP;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Trip;
    } catch {
      /* ignore */
    }
    return SEED_TRIP;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    } catch {
      /* quota — ignore */
    }
  }, [trip]);

  const setTrip = useCallback((next: Trip) => setTripState(next), []);

  const resetTrip = useCallback(() => setTripState(SEED_TRIP), []);

  const updateTripField = useCallback(<K extends keyof Trip>(key: K, value: Trip[K]) => {
    setTripState((t) => ({ ...t, [key]: value }));
  }, []);

  return { trip, setTrip, resetTrip, updateTripField };
}
