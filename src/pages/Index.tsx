import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudRain, Sun, Download, Calendar, Compass, RotateCcw, Sparkles, BookOpen } from 'lucide-react';
import { useTrip } from '@/hooks/useTrip';
import { useWeather } from '@/hooks/useWeather';
import { useRainMode, RainModeProvider } from '@/contexts/RainModeContext';
import { TripMap } from '@/components/TripMap';
import { WeatherWidget } from '@/components/WeatherWidget';
import { RainAlertBanner } from '@/components/RainAlertBanner';
import { StopCard } from '@/components/StopCard';
import { NearbyAttractions } from '@/components/NearbyAttractions';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { exportTripPdf } from '@/lib/pdfExport';
import { toast } from 'sonner';

function formatDateRange(start: string, end: string) {
  try {
    const s = new Date(start).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    const e = new Date(end).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${s} — ${e}`;
  } catch {
    return `${start} — ${end}`;
  }
}

function ShickoToursApp() {
  const navigate = useNavigate();
  const { trip, resetTrip } = useTrip();
  const { data: weather, loading: weatherLoading, error: weatherError } = useWeather(trip.weatherCity);
  const { rainActive, manualOverride, setManualOverride, setAutoTrigger } = useRainMode();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [exporting, setExporting] = useState(false);

  // Auto-trigger Plan B when rain probability > 40%
  useEffect(() => {
    if (weather) setAutoTrigger(weather.rainProbability > 0.4);
  }, [weather, setAutoTrigger]);

  const activeStops = rainActive ? trip.planB : trip.stops;
  const anchorCoords = useMemo(
    () => activeStops[0]?.coords ?? trip.stops[0]?.coords ?? { lat: 32.7, lng: 35.5 },
    [activeStops, trip.stops]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTripPdf({ trip, rainActive, weather, mapSnapshotUrl: null });
      toast.success('המדריך הורד בהצלחה');
    } catch (e) {
      console.error(e);
      toast.error('יצוא PDF נכשל');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <header className="gradient-hero relative overflow-hidden text-white shadow-card">
        <div className="container mx-auto px-4 pb-6 pt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold tracking-wide">shickotours</span>
            </div>
            <WeatherWidget data={weather} loading={weatherLoading} error={weatherError} />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold leading-tight md:text-3xl">{trip.name}</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>

          {/* Manual rain toggle */}
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/15 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div
                className={`grid h-9 w-9 place-items-center rounded-xl transition-smooth ${
                  manualOverride ? 'bg-white text-rain' : 'bg-white/20'
                }`}
              >
                {manualOverride ? <CloudRain className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">הפעל תוכנית גשם ידנית</p>
                <p className="text-[11px] text-white/80">עובר לתוכנית מקורה ללא תלות בתחזית</p>
              </div>
            </div>
            <Switch
              checked={manualOverride}
              onCheckedChange={setManualOverride}
              className="data-[state=checked]:bg-white data-[state=checked]:[&>span]:bg-rain"
              aria-label="הפעל תוכנית גשם ידנית"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-4 px-4 py-5">
        {/* Map */}
        <section
          className="overflow-hidden rounded-2xl bg-card shadow-card"
          style={{ height: 'min(45vh, 380px)' }}
        >
          <TripMap
            stops={trip.stops}
            planBStops={trip.planB}
            highlightPlanB={rainActive}
            onMapReady={(m) => (mapRef.current = m)}
          />
        </section>

        {/* Action row */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 gap-2 gradient-sunset border-0 text-white shadow-soft hover:opacity-95"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'מכין PDF…' : 'הורד מדריך טיול'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetTrip();
              toast.success('הטיול אופס לברירת המחדל');
            }}
            className="gap-1.5"
            aria-label="איפוס טיול"
          >
            <RotateCcw className="h-4 w-4" />
            איפוס
          </Button>
        </div>

        {/* Rain alert banner */}
        {rainActive && (
          <RainAlertBanner
            manual={manualOverride}
            rainProbability={weather?.rainProbability}
            rainMm={weather?.rainMm}
          />
        )}

        {/* Active itinerary */}
        <section>
          <header className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              {rainActive ? (
                <>
                  <CloudRain className="h-5 w-5 text-rain" />
                  תוכנית B — מקורה
                </>
              ) : (
                <>
                  <Sun className="h-5 w-5 text-accent" />
                  המסלול שלך
                </>
              )}
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              {activeStops.length} תחנות
            </span>
          </header>
          <div className="space-y-3">
            {activeStops.map((stop, i) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={i}
                variant={rainActive ? 'planB' : 'primary'}
              />
            ))}
          </div>
        </section>

        {/* Plan B preview when not active */}
        {!rainActive && trip.planB.length > 0 && (
          <section className="rounded-2xl border-2 border-dashed border-rain/30 bg-rain-soft p-4">
            <header className="mb-2 flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-rain" />
              <h3 className="text-sm font-bold text-rain">חלופות לגשם זמינות</h3>
              <span className="text-xs text-muted-foreground">({trip.planB.length} מקומות מקורים)</span>
            </header>
            <p className="text-xs text-muted-foreground">
              הפעל את כפתור הגשם למעלה או חכה להתראת מזג אוויר אוטומטית.
            </p>
          </section>
        )}

        {/* Nearby attractions */}
        <NearbyAttractions
          center={anchorCoords}
          indoorBias={rainActive}
          trip={trip}
          weather={weather}
        />

        <footer className="pb-6 pt-4 text-center text-xs text-muted-foreground">
          shickotours · נוצר באהבה לטיולים בארץ 🧭
        </footer>
      </main>
    </div>
  );
}

const Index = () => (
  <RainModeProvider>
    <ShickoToursApp />
  </RainModeProvider>
);

export default Index;
