import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Compass,
  Loader2,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTrip } from "@/hooks/useTrip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REGIONS = [
  { value: "galilee", label: "גליל" },
  { value: "golan", label: "רמת הגולן" },
  { value: "jerusalem", label: "ירושלים והסביבה" },
  { value: "negev", label: "נגב ומכתשים" },
  { value: "coast", label: "מישור החוף" },
  { value: "deadsea", label: "ים המלח" },
  { value: "eilat", label: "אילת והרי אילת" },
  { value: "carmel", label: "כרמל וחיפה" },
  { value: "judea", label: "שפלת יהודה" },
];

const STYLES = [
  { value: "nature", label: "טבע" },
  { value: "food", label: "אוכל" },
  { value: "history", label: "היסטוריה" },
  { value: "views", label: "נופים" },
  { value: "adventure", label: "אתגרי" },
  { value: "easy", label: "קליל" },
];

const GROUPS = [
  { value: "family", label: "משפחה עם ילדים" },
  { value: "couple", label: "זוג" },
  { value: "friends", label: "חברים" },
  { value: "solo", label: "יחיד/ה" },
];

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (d?: Date) => (d ? format(d, "dd/MM/yyyy", { locale: he }) : "");

export default function PlanTrip() {
  const navigate = useNavigate();
  const { setTrip } = useTrip();

  const tomorrow = new Date(Date.now() + 86400000);
  const inThreeDays = new Date(Date.now() + 3 * 86400000);

  const [region, setRegion] = useState("galilee");
  const [startDate, setStartDate] = useState<Date | undefined>(tomorrow);
  const [endDate, setEndDate] = useState<Date | undefined>(inThreeDays);
  const [styles, setStyles] = useState<string[]>(["nature", "views"]);
  const [group, setGroup] = useState("family");
  const [pace, setPace] = useState(3);
  const [loading, setLoading] = useState(false);

  const toggleStyle = (val: string) => {
    setStyles((s) =>
      s.includes(val) ? s.filter((x) => x !== val) : [...s, val],
    );
  };

  const submit = async () => {
    if (!startDate || !endDate) {
      toast.error("יש לבחור תאריכי התחלה וסיום");
      return;
    }
    if (endDate < startDate) {
      toast.error("תאריך סיום חייב להיות אחרי תאריך התחלה");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-trip", {
        body: {
          region,
          startDate: toISO(startDate),
          endDate: toISO(endDate),
          styles,
          group,
          pace,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.trip) throw new Error("לא התקבל מסלול תקין");

      setTrip(data.trip);
      toast.success("המסלול נוצר! 🎉");
      navigate("/trip");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "שגיאה לא צפויה";
      console.error(e);
      toast.error(`יצירת מסלול נכשלה: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero with gradient — matches Landing */}
      <header className="relative overflow-hidden text-white shadow-card">
        <div className="absolute inset-0 -z-10 gradient-hero" />
        <div className="pointer-events-none absolute -top-12 -right-12 -z-10 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 -z-10 h-64 w-64 rounded-full bg-rain/30 blur-3xl" />

        <div className="container mx-auto px-4 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-semibold opacity-90 hover:opacity-100"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה
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
              ספרו לנו על הטיול הבא שלכם
            </h1>
            <p
              className="mt-2 text-sm text-white/85 md:text-base"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}
            >
              5 שדות, 30 שניות, ומסלול מלא ממתין לכם.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto -mt-6 max-w-2xl space-y-5 px-4 pb-10">
        <Card className="space-y-6 border-white/40 bg-white/90 p-6 backdrop-blur-xl shadow-card">
          {/* Region */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">אזור הטיול</Label>
            <Select value={region} onValueChange={setRegion} dir="rtl">
              <SelectTrigger className="bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-bold">תאריך התחלה</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start gap-2 bg-secondary/40 font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {startDate ? fmt(startDate) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={he}
                    className="pointer-events-auto p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">תאריך סיום</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start gap-2 bg-secondary/40 font-normal",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {endDate ? fmt(endDate) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={he}
                    disabled={(d) => (startDate ? d < startDate : false)}
                    className="pointer-events-auto p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Style chips — sunset accent */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">סוג הטיול (ניתן לבחור כמה)</Label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => {
                const active = styles.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleStyle(s.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-smooth",
                      active
                        ? "border-accent bg-accent text-accent-foreground shadow-soft"
                        : "border-accent/40 bg-background text-accent hover:bg-accent/10",
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group chips — teal primary */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">הרכב</Label>
            <div className="flex flex-wrap gap-2">
              {GROUPS.map((g) => {
                const active = group === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGroup(g.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-smooth",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-primary/40 bg-background text-primary hover:bg-primary/10",
                    )}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pace */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">קצב</Label>
              <span className="text-xs font-semibold text-accent">
                {pace <= 2 ? "רגוע" : pace >= 4 ? "אינטנסיבי" : "מאוזן"}
              </span>
            </div>
            <Slider
              value={[pace]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => setPace(v[0])}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>רגוע</span>
              <span>אינטנסיבי</span>
            </div>
          </div>
        </Card>

        <Button
          onClick={submit}
          disabled={loading}
          size="lg"
          className="w-full gap-2 gradient-sunset border-0 text-white shadow-glow"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              בונה מסלול חכם...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              צור לי מסלול
              <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>

        {loading && (
          <p className="text-center text-xs text-muted-foreground">
            ה-AI חוקר את האזור, בוחר תחנות אמיתיות ומוודא קואורדינטות. עד כדקה.
          </p>
        )}
      </main>
    </div>
  );
}
