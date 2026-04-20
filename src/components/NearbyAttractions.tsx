import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Loader2,
  MapPin,
  Star,
  Clock,
  ExternalLink,
  RefreshCw,
  CloudRain,
  Sun,
  Filter,
} from 'lucide-react';
import type { Coordinates, Trip } from '@/types/trip';
import type { WeatherSnapshot } from '@/hooks/useWeather';
import { useDiscoverPlaces, currentTimeOfDay } from '@/hooks/useDiscoverPlaces';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NearbyAttractionsProps {
  center: Coordinates;
  indoorBias?: boolean;
  trip: Trip;
  weather: WeatherSnapshot | null;
}

const CATEGORY_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'nature', label: 'טבע' },
  { key: 'food', label: 'אוכל' },
  { key: 'culture', label: 'תרבות' },
  { key: 'view', label: 'נופים' },
  { key: 'activity', label: 'פעילויות' },
  { key: 'indoor', label: 'מקורה' },
];

function formatOpenStatus(openNow?: boolean) {
  if (openNow === undefined) return null;
  return openNow ? 'פתוח עכשיו' : 'סגור כרגע';
}

export function NearbyAttractions({
  center,
  indoorBias = false,
  trip,
  weather,
}: NearbyAttractionsProps) {
  const { places, loading, error, discover, lastFetchedAt } = useDiscoverPlaces();
  const [categories, setCategories] = useState<string[]>([]);

  const ctx = useMemo(
    () => ({
      center,
      regionName: trip.weatherCity,
      tripName: trip.name,
      rainActive: indoorBias,
      rainProbability: weather?.rainProbability ?? 0,
      temperatureC: weather?.tempC,
      timeOfDay: currentTimeOfDay(),
      existingStops: [...trip.stops, ...trip.planB].map((s) => ({
        name: s.name,
        category: s.category,
      })),
      categories,
      radiusMeters: 12000,
    }),
    [center, indoorBias, weather, trip, categories],
  );

  // Auto-fetch when center / indoorBias changes (but not on every category tweak —
  // user presses refresh for that).
  useEffect(() => {
    discover(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, indoorBias]);

  const toggleCategory = (key: string) => {
    setCategories((curr) =>
      curr.includes(key) ? curr.filter((c) => c !== key) : [...curr, key],
    );
  };

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold">המלצות חכמות בסביבה</h2>
        {indoorBias ? (
          <Badge variant="outline" className="gap-1 border-rain/40 text-rain">
            <CloudRain className="h-3 w-3" />
            מותאם לגשם
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-accent/40 text-accent">
            <Sun className="h-3 w-3" />
            {ctx.timeOfDay === 'afternoon'
              ? 'אחר הצהריים'
              : ctx.timeOfDay === 'morning'
                ? 'בוקר'
                : ctx.timeOfDay === 'evening'
                  ? 'ערב'
                  : ctx.timeOfDay === 'night'
                    ? 'לילה'
                    : 'צהריים'}
          </Badge>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ms-auto h-7 gap-1 text-xs"
          onClick={() => discover(ctx)}
          disabled={loading}
          aria-label="רענן המלצות"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </header>

      {/* Category filters */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Filter className="h-3 w-3 text-muted-foreground" />
        {CATEGORY_FILTERS.map((f) => {
          const active = categories.includes(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => toggleCategory(f.key)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-smooth ${
                active
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f.label}
            </button>
          );
        })}
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setCategories([]);
              discover({ ...ctx, categories: [] });
            }}
            className="text-[11px] text-muted-foreground underline underline-offset-2"
          >
            נקה
          </button>
        )}
        {categories.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-[11px]"
            onClick={() => discover(ctx)}
            disabled={loading}
          >
            החל
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          המנוע החכם מחפש ומדרג המלצות מותאמות אישית…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          לא הצלחנו לטעון המלצות כרגע: {error}
        </div>
      )}

      {!loading && !error && places.length === 0 && lastFetchedAt && (
        <p className="py-3 text-xs text-muted-foreground">
          לא נמצאו המלצות שתואמות את המסננים. נסה להסיר כמה פילטרים.
        </p>
      )}

      <ul className="space-y-3">
        {places.map((p) => {
          const status = formatOpenStatus(p.openNow);
          const mapsLink =
            p.googleMapsUri ||
            `https://www.google.com/maps/search/?api=1&query=${p.location.lat},${p.location.lng}&query_place_id=${p.placeId}`;
          return (
            <li
              key={p.placeId}
              className="relative overflow-hidden rounded-xl border border-border bg-secondary/40 p-3"
            >
              {/* Match score badge */}
              <div className="absolute start-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary text-[11px] font-bold text-primary-foreground shadow-soft">
                {p.matchScore}
              </div>

              <div className="ps-12">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold">{p.name}</h3>
                    <p className="truncate text-[11px] text-muted-foreground">{p.address}</p>
                  </div>
                </div>

                {/* AI pitch */}
                {p.aiPitch && (
                  <p className="mt-2 text-[13px] leading-relaxed text-foreground/90">
                    {p.aiPitch}
                  </p>
                )}

                {/* Reason */}
                {p.reason && (
                  <p className="mt-1.5 flex items-start gap-1 text-[11px] italic text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                    <span>{p.reason}</span>
                  </p>
                )}

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  {p.rating && (
                    <span className="flex items-center gap-0.5 text-accent">
                      <Star className="h-3 w-3 fill-current" />
                      {p.rating.toFixed(1)}
                      {p.userRatingCount ? (
                        <span className="text-muted-foreground"> ({p.userRatingCount})</span>
                      ) : null}
                    </span>
                  )}
                  {status && (
                    <span
                      className={`flex items-center gap-0.5 font-medium ${
                        p.openNow ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {status}
                    </span>
                  )}
                  {p.isIndoor && (
                    <span className="rounded-full bg-rain/10 px-1.5 py-0.5 font-semibold text-rain">
                      מקורה
                    </span>
                  )}
                </div>

                {/* Tags */}
                {p.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="h-8 flex-1 gap-1">
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer">
                      <MapPin className="h-3 w-3" />
                      פתח במפות
                    </a>
                  </Button>
                  {p.websiteUri && (
                    <Button asChild size="sm" variant="ghost" className="h-8 gap-1">
                      <a href={p.websiteUri} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                        אתר
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {places.length > 0 && (
        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          המלצות נוצרו על ידי AI בשילוב עם Google Places · מותאמות למזג האוויר ולשעה
        </p>
      )}
    </section>
  );
}
