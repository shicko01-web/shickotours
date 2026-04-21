import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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

function todayISO(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

export default function PlanTrip() {
  const navigate = useNavigate();
  const { setTrip } = useTrip();

  const [region, setRegion] = useState("galilee");
  const [startDate, setStartDate] = useState(todayISO(1));
  const [endDate, setEndDate] = useState(todayISO(3));
  const [styles, setStyles] = useState<string[]>(["nature", "views"]);
  const [group, setGroup] = useState("family");
  const [pace, setPace] = useState(3);
  const [loading, setLoading] = useState(false);

  const toggleStyle = (val: string) => {
    setStyles((s) => (s.includes(val) ? s.filter((x) => x !== val) : [...s, val]));
  };

  const submit = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("תאריך סיום חייב להיות אחרי תאריך התחלה");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-trip", {
        body: { region, startDate, endDate, styles, group, pace },
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
      <header className="gradient-hero text-white shadow-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold opacity-90 hover:opacity-100">
            <ArrowRight className="h-4 w-4" />
            חזרה
          </Link>
          <h1 className="text-base font-bold md:text-lg">תכנון טיול חדש</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="container mx-auto max-w-2xl space-y-5 px-4 py-6">
        <Card className="space-y-5 p-5">
          {/* Region */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">אזור הטיול</Label>
            <Select value={region} onValueChange={setRegion} dir="rtl">
              <SelectTrigger>
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
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">תאריך סיום</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Style */}
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
                        ? "border-primary bg-primary text-primary-foreground shadow-soft"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group */}
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
                        ? "border-accent bg-accent text-accent-foreground shadow-soft"
                        : "border-border bg-background text-foreground hover:bg-muted"
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
              <span className="text-xs text-muted-foreground">
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
