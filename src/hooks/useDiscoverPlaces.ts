import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DiscoveredPlace {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  openNow?: boolean;
  weekdayText?: string[];
  types: string[];
  primaryType?: string;
  location: { lat: number; lng: number };
  editorialSummary?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  isIndoor: boolean;
  aiPitch: string;
  matchScore: number;
  tags: string[];
  reason: string;
}

export interface DiscoverContext {
  center: { lat: number; lng: number };
  regionName?: string;
  rainActive?: boolean;
  rainProbability?: number;
  temperatureC?: number;
  timeOfDay?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
  tripName?: string;
  existingStops?: Array<{ name: string; category?: string }>;
  categories?: string[];
  radiusMeters?: number;
}

interface State {
  loading: boolean;
  error: string | null;
  places: DiscoveredPlace[];
  queries: Array<{ query: string; intent: string }>;
  lastFetchedAt: number | null;
}

export function useDiscoverPlaces() {
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    places: [],
    queries: [],
    lastFetchedAt: null,
  });
  const latestRef = useRef(0);

  const discover = useCallback(async (ctx: DiscoverContext) => {
    const callId = ++latestRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await supabase.functions.invoke('ai-discover-places', {
        body: ctx,
      });
      if (callId !== latestRef.current) return; // stale
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setState({
        loading: false,
        error: null,
        places: data?.recommendations ?? [],
        queries: data?.queries ?? [],
        lastFetchedAt: Date.now(),
      });
    } catch (e) {
      if (callId !== latestRef.current) return;
      const msg = e instanceof Error ? e.message : 'שגיאה בחיפוש המלצות';
      setState((s) => ({ ...s, loading: false, error: msg }));
    }
  }, []);

  const reset = useCallback(() => {
    latestRef.current++;
    setState({ loading: false, error: null, places: [], queries: [], lastFetchedAt: null });
  }, []);

  return { ...state, discover, reset };
}

/** Helper: infer time-of-day bucket from local time */
export function currentTimeOfDay(): DiscoverContext['timeOfDay'] {
  const h = new Date().getHours();
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 14) return 'noon';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}
