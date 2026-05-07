import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, Sparkles, Clock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTrip } from "@/hooks/useTrip";
import type { CandidateBundle, Trip, TripCandidate } from "@/types/trip";
import { toast } from "sonner";

const CATEGORY_LABEL: Record<string, string> = {
  nature: "טבע",
  food: "אוכל",
  culture: "תרבות",
  view: "תצפית",
  activity: "פעילות",
};

function candidateToTrip(c: TripCandidate, b: CandidateBundle): Trip {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `trip-${c.id}-${Date.now().toString(36)}`,
    name: c.name,
    startDate: today,
    endDate: today,
    weatherCity: b.weatherCity,
    region: b.region,
    overview: c.overview,
    highlights: c.highlights,
    planParams: b.planParams,
    stops: [
      {
        id: c.id,
        name: c.name,
        description: c.shortPitch,
        details: c.overview,
        tips: c.tips,
        coords: c.coords,
        durationMin: c.durationMin,
        category: c.category,
      },
    ],
    planB: [],
  };
}

export default function TripOptions() {
  const navigate = useNavigate();
  const { setTrip } = useTrip();
  const [bundle, setBundle] = useState<CandidateBundle | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("shickotours.candidates.v1");
      if (raw) setBundle(JSON.parse(raw) as CandidateBundle);
    } catch {
      /* ignore */
    }
  }, []);

  const pick = (c: TripCandidate) => {
    if (!bundle) return;
    const trip = candidateToTrip(c, bundle);
    setTrip(trip);
    toast.success(`נבחר: ${c.name}`);
    navigate("/trip");
  };

  if (!bundle) {
    return (
      <div className="container mx-auto max-w-xl space-y-4 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">לא נמצאו אופציות. נסה ליצור חיפוש חדש.</p>
        <Button onClick={() => navigate("/plan")} className="gap-2">
          <Sparkles className="h-4 w-4" />
          חזרה לתכנון
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden text-white shadow-card">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="container mx-auto px-4 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <Link
              to="/plan"
              className="flex items-center gap-1.5 text-sm font-semibold opacity-90 hover:opacity-100"
            >
              <ArrowRight className="h-4 w-4" />
              שנה חיפוש
            </Link>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <Compass className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">shickotours</span>
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <h1
              className="text-2xl font-extrabold leading-tight md:text-4xl"
              style={{ textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
            >
              אופציות באזור {bundle.regionLabel}
            </h1>
            <p className="mt-2 text-sm text-white/85">
              בחרו יעד אחד כדי לראות את כל הפרטים, ניווט ומקומות נוספים בקרבת מקום.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto -mt-6 max-w-2xl space-y-4 px-4 pb-10">
        {bundle.candidates.map((c) => (
          <Card key={c.id} className="space-y-3 border-white/40 bg-white/95 p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight">{c.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{c.shortPitch}</p>
              </div>
              {c.category && (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                  {CATEGORY_LABEL[c.category] ?? c.category}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed text-foreground/85">{c.overview}</p>

            {c.highlights?.length > 0 && (
              <ul className="space-y-1">
                {c.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {c.durationMin && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  כ-{Math.round(c.durationMin / 60 * 10) / 10} שעות
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {c.coords.lat.toFixed(3)}, {c.coords.lng.toFixed(3)}
              </span>
            </div>

            <Button
              onClick={() => pick(c)}
              className="w-full gap-2 gradient-sunset border-0 text-white shadow-soft"
            >
              <Sparkles className="h-4 w-4" />
              אני בוחר/ת בזה
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={() => navigate("/plan")}
          className="w-full gap-1.5"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה ושינוי קריטריונים
        </Button>
      </main>
    </div>
  );
}
