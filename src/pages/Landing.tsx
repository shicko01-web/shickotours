import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Sparkles, CloudRain, MapPinned, ArrowLeft, Play } from "lucide-react";
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
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden text-white">
        <div className="container mx-auto px-4 pb-16 pt-10">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-wide">shickotours</span>
          </div>

          <div className="mt-12 max-w-2xl">
            <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
              תכננו טיול בארץ ב-30 שניות
            </h1>
            <p className="mt-4 text-base text-white/90 md:text-lg">
              מנוע תכנון חכם שמבין את האזור, מזג האוויר והסגנון שלכם —
              ובונה לכם מסלול מותאם אישית עם תוכנית גיבוי לימי גשם.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
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
                  className="gap-2 border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <Link to="/trip">
                    <Play className="h-4 w-4" />
                    המשך: {savedTripName}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* decorative blobs */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-12 -right-12 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-center text-xl font-bold md:text-2xl">איך זה עובד</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 shadow-soft transition-smooth hover:shadow-card">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPinned className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-bold">תכנון מותאם</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              ספרו לנו אזור, תאריכים וסגנון — וה-AI יבנה מסלול אמיתי וזורם גיאוגרפית.
            </p>
          </Card>

          <Card className="p-5 shadow-soft transition-smooth hover:shadow-card">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-bold">גילוי חכם בקרבת מקום</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              המלצות בזמן אמת ממוקדות הקשר — שעות פתיחה, דירוגים, ופילטר לפי מצב הרוח.
            </p>
          </Card>

          <Card className="p-5 shadow-soft transition-smooth hover:shadow-card">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rain/10 text-rain">
              <CloudRain className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-bold">Plan B אוטומטי לגשם</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              תחזית מסומנת אדום? המערכת מציעה אלטרנטיבות מקורות מבלי שתצטרכו להזיע.
            </p>
          </Card>
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="gap-2 gradient-sunset border-0 text-white">
            <Link to="/plan">
              בואו נתחיל
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="pb-8 text-center text-xs text-muted-foreground">
        shickotours · נוצר באהבה לטיולים בארץ 🧭
      </footer>
    </div>
  );
}
