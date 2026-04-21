import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Sparkles,
  CloudRain,
  MapPinned,
  ArrowLeft,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STORAGE_KEY = "shickotours.trip.v1";

export default function Landing() {
  const [hasSavedTrip, setHasSavedTrip] = useState(false);
  const [savedTripName, setSavedTripName] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id) {
          setHasSavedTrip(true);
          setSavedTripName(parsed.name ?? "הטיול האחרון שלך");
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-wide">shickotours</span>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/plan">צור טיול חדש</Link>
            </Button>
            {hasSavedTrip && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/trip">המשך טיול אחרון</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Immersive Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="pointer-events-none absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-rain/30 blur-3xl" />

        <div className="container mx-auto px-4 pb-20 pt-16 text-center text-white md:pt-24">
          <h1
            className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            תכננו טיול בארץ ב-30 שניות
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-base text-white/90 md:text-lg"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
          >
            מנוע תכנון חכם שמבין אזור, מזג אוויר וסגנון — ובונה לכם מסלול אמיתי
            עם תוכנית גיבוי לימי גשם.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 gradient-sunset border-0 text-white shadow-glow hover:opacity-95"
            >
              <Link to="/plan">
                <Sparkles className="h-5 w-5" />
                צור טיול חדש
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>

            {hasSavedTrip && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 bg-white/15 text-white backdrop-blur-md hover:bg-white/25 hover:text-white"
              >
                <Link to="/trip">
                  <Play className="h-4 w-4" />
                  המשך: {savedTripName}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* How it works on soft sand */}
      <section className="bg-secondary/60 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">
            איך זה עובד?
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-white/40 bg-white/70 p-6 text-center backdrop-blur shadow-soft transition-smooth hover:shadow-card">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MapPinned className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">תכנון מותאם</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                ספרו לנו אזור, תאריכים וסגנון — וה-AI יבנה מסלול אמיתי וזורם
                גיאוגרפית.
              </p>
            </Card>

            <Card className="border-white/40 bg-white/70 p-6 text-center backdrop-blur shadow-soft transition-smooth hover:shadow-card">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">גילוי חכם</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                המלצות בקרבת מקום בזמן אמת — שעות פתיחה, דירוגים, ופילטר לפי
                הקשר.
              </p>
            </Card>

            <Card className="border-white/40 bg-white/70 p-6 text-center backdrop-blur shadow-soft transition-smooth hover:shadow-card">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rain/10 text-rain">
                <CloudRain className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Plan B לגשם</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                תחזית מסומנת אדום? המערכת מציעה אלטרנטיבות מקורות בלי לעבוד
                קשה.
              </p>
            </Card>
          </div>

          <div className="mt-10 flex justify-center">
            <Button
              asChild
              size="lg"
              className="gap-2 gradient-sunset border-0 text-white shadow-soft"
            >
              <Link to="/plan">
                בואו נתחיל
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="pb-8 pt-6 text-center text-xs text-muted-foreground">
        shickotours · נוצר באהבה לטיולים בארץ 🧭
      </footer>
    </div>
  );
}
