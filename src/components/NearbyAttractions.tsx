/// <reference types="google.maps" />
import { useEffect, useState } from 'react';
import { Sparkles, Loader2, MapPin } from 'lucide-react';
import { loadGoogleMaps, hasGoogleMapsKey } from '@/lib/googleMaps';
import type { Coordinates } from '@/types/trip';
import { Button } from '@/components/ui/button';

interface NearbyAttractionsProps {
  /** Anchor location (e.g. current waypoint) */
  center: Coordinates;
  /** Whether to bias toward indoor / weather-proof spots */
  indoorBias?: boolean;
}

interface NearbyPlace {
  id: string;
  name: string;
  vicinity: string;
  rating?: number;
  coords: Coordinates;
  types: string[];
}

const INDOOR_TYPES = ['museum', 'shopping_mall', 'art_gallery', 'aquarium', 'movie_theater', 'spa'];
const OUTDOOR_TYPES = ['tourist_attraction', 'park', 'natural_feature'];

export function NearbyAttractions({ center, indoorBias = false }: NearbyAttractionsProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasGoogleMapsKey()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadGoogleMaps()
      .then((g) => {
        // Places library needs a DOM node attribution; use a hidden div.
        const attrDiv = document.createElement('div');
        const svc = new g.maps.places.PlacesService(attrDiv);
        const type = indoorBias ? INDOOR_TYPES[0] : OUTDOOR_TYPES[0];

        svc.nearbySearch(
          {
            location: center,
            radius: 8000,
            type,
            language: 'he',
          },
          (results, status) => {
            if (cancelled) return;
            if (status !== g.maps.places.PlacesServiceStatus.OK || !results) {
              setPlaces([]);
              setError(`status:${status}`);
              setLoading(false);
              return;
            }
            const mapped: NearbyPlace[] = results.slice(0, 6).map((p) => ({
              id: p.place_id ?? `${p.name}-${Math.random()}`,
              name: p.name ?? 'ללא שם',
              vicinity: p.vicinity ?? '',
              rating: p.rating,
              coords: {
                lat: p.geometry?.location?.lat() ?? center.lat,
                lng: p.geometry?.location?.lng() ?? center.lng,
              },
              types: p.types ?? [],
            }));
            setPlaces(mapped);
            setLoading(false);
          }
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? 'failed');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, indoorBias]);

  if (!hasGoogleMapsKey()) return null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <header className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold">אטרקציות נוספות בסביבה</h2>
        {indoorBias && (
          <span className="rounded-full bg-rain/10 px-2 py-0.5 text-[10px] font-semibold text-rain">
            מקורות
          </span>
        )}
      </header>

      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> מחפש המלצות…
        </div>
      )}

      {!loading && places.length === 0 && (
        <p className="py-2 text-xs text-muted-foreground">
          {error ? 'לא נמצאו תוצאות כעת.' : 'אין המלצות עדיין.'}
        </p>
      )}

      <ul className="space-y-2">
        {places.map((p) => {
          const gmaps = `https://www.google.com/maps/search/?api=1&query=${p.coords.lat},${p.coords.lng}&query_place_id=${p.id}`;
          return (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-secondary/60 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{p.vicinity}</p>
                {p.rating && (
                  <p className="mt-0.5 text-[11px] text-amber-600">★ {p.rating.toFixed(1)}</p>
                )}
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0 gap-1">
                <a href={gmaps} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-3 w-3" /> פתח
                </a>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
