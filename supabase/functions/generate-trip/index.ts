// Generate 3-5 single-destination trip candidates within a chosen Israel region.
// Public function (verify_jwt = false). CORS enabled.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlanInput {
  region: string;
  styles: string[];
  group: string;
}

interface AICandidate {
  name: string;
  shortPitch: string;
  overview: string;
  highlights: string[];
  tips: string[];
  category?: string;
  durationMin?: number;
  approxLat?: number;
  approxLng?: number;
}

interface AIResult {
  candidates: AICandidate[];
}

interface RegionHint {
  weatherCity: string;
  bbox: string;
  center: { lat: number; lng: number };
  bounds: [number, number, number, number]; // [minLat, maxLat, minLng, maxLng]
  examples: string[];
  label: string;
}

const REGION_HINTS: Record<string, RegionHint> = {
  galilee: {
    weatherCity: "Rosh Pina,IL",
    bbox: "Galilee, Northern Israel",
    label: "גליל",
    center: { lat: 32.97, lng: 35.50 },
    bounds: [32.70, 33.30, 35.10, 35.85],
    examples: ["ראש פינה", "צפת", "הר מירון", "נחל עמוד", "כפר ורדים"],
  },
  golan: {
    weatherCity: "Katzrin,IL",
    bbox: "Golan Heights, Israel",
    label: "רמת הגולן",
    center: { lat: 32.99, lng: 35.69 },
    bounds: [32.70, 33.40, 35.55, 35.95],
    examples: ["קצרין", "בריכת המשושים", "נמרוד", "בנטל", "גמלא"],
  },
  jerusalem: {
    weatherCity: "Jerusalem,IL",
    bbox: "Jerusalem and surroundings, Israel",
    label: "ירושלים והסביבה",
    center: { lat: 31.78, lng: 35.22 },
    bounds: [31.65, 31.90, 35.05, 35.40],
    examples: ["העיר העתיקה ירושלים", "עין כרם", "יד ושם", "מוזיאון ישראל", "נחל שורק", "הר הצופים"],
  },
  negev: {
    weatherCity: "Mitzpe Ramon,IL",
    bbox: "Negev desert, Israel",
    label: "נגב ומכתשים",
    center: { lat: 30.61, lng: 34.80 },
    bounds: [29.55, 31.25, 34.30, 35.30],
    examples: ["מצפה רמון", "מכתש רמון", "עין עבדת", "שדה בוקר", "פארק ירוחם", "נחל חווארים"],
  },
  coast: {
    weatherCity: "Tel Aviv,IL",
    bbox: "Israeli coastal plain",
    label: "מישור החוף",
    center: { lat: 32.08, lng: 34.78 },
    bounds: [31.60, 32.95, 34.55, 34.95],
    examples: ["נמל יפו", "פארק הירקון", "קיסריה", "נתניה", "הרצליה"],
  },
  deadsea: {
    weatherCity: "Ein Gedi,IL",
    bbox: "Dead Sea region, Israel",
    label: "ים המלח",
    center: { lat: 31.46, lng: 35.39 },
    bounds: [31.10, 31.85, 35.25, 35.55],
    examples: ["עין גדי", "מצדה", "עין בוקק", "נחל דוד", "קומראן"],
  },
  eilat: {
    weatherCity: "Eilat,IL",
    bbox: "Eilat and Eilat mountains, Israel",
    label: "אילת והרי אילת",
    center: { lat: 29.55, lng: 34.95 },
    bounds: [29.45, 29.95, 34.80, 35.10],
    examples: ["שמורת האלמוגים", "הר יואש", "עמודי עמרם", "נחל גישרון", "מצפור הקאניון האדום"],
  },
  carmel: {
    weatherCity: "Haifa,IL",
    bbox: "Carmel and Haifa region, Israel",
    label: "כרמל וחיפה",
    center: { lat: 32.74, lng: 35.00 },
    bounds: [32.55, 32.90, 34.85, 35.20],
    examples: ["גני הבהאים", "מוחרקה", "עין הוד", "דליית אל-כרמל", "נחל מערות"],
  },
  judea: {
    weatherCity: "Beit Shemesh,IL",
    bbox: "Judean lowlands and hills, Israel",
    label: "שפלת יהודה",
    center: { lat: 31.74, lng: 34.99 },
    bounds: [31.55, 31.95, 34.75, 35.20],
    examples: ["בית גוברין", "מערת התאומים", "פארק בריטניה", "נחל שורק", "מצודת מעון"],
  },
};

function inBounds(
  lat: number | undefined,
  lng: number | undefined,
  b: [number, number, number, number],
): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  return lat >= b[0] && lat <= b[1] && lng >= b[2] && lng <= b[3];
}

async function geocode(
  query: string,
  apiKey: string,
  bounds?: [number, number, number, number],
): Promise<{ lat: number; lng: number } | null> {
  try {
    const bboxParam = bounds
      ? `&bounds=${bounds[0]},${bounds[2]}|${bounds[1]},${bounds[3]}`
      : "";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query + ", Israel",
    )}&key=${apiKey}&language=he&region=il${bboxParam}`;
    const r = await fetch(url);
    const j = await r.json();
    const loc = j?.results?.[0]?.geometry?.location;
    if (loc?.lat && loc?.lng) return { lat: loc.lat, lng: loc.lng };
  } catch (e) {
    console.error("geocode error", query, e);
  }
  return null;
}

function fallbackCandidate(hint: RegionHint, index: number) {
  const name = hint.examples[index % Math.max(1, hint.examples.length)] || hint.bbox;
  const lat = Math.min(hint.bounds[1], Math.max(hint.bounds[0], hint.center.lat + (index - 1) * 0.025));
  const lng = Math.min(hint.bounds[3], Math.max(hint.bounds[2], hint.center.lng + (index % 3 - 1) * 0.025));
  return {
    name,
    shortPitch: `יעד באזור ${hint.label}`,
    overview: `יעד באזור ${hint.label}, מתאים לטיול יום קצר וקליל. נבחר כגיבוי כשההצעה המקורית חרגה מגבולות האזור.`,
    highlights: ["מתאים לטיול יום בודד", "באזור הנכון", "נגיש"],
    tips: ["בדקו שעות פתיחה", "קחו מים וכובע"],
    coords: { lat, lng },
    durationMin: 120,
    category: "nature",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as PlanInput;
    if (!body?.region) {
      return new Response(JSON.stringify({ error: "Missing region" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAPS_KEY = Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const hint: RegionHint = REGION_HINTS[body.region] ?? {
      weatherCity: "Tel Aviv,IL",
      bbox: body.region,
      label: body.region,
      center: { lat: 32.08, lng: 34.78 },
      bounds: [29.45, 33.40, 34.30, 35.95],
      examples: [],
    };

    const systemPrompt = `אתה מתכנן טיולים מומחה לישראל. אסור להציע מקומות מחוץ לאזור הגאוגרפי שביקש המשתמש. כל הטקסטים בעברית. החזר רק קריאה לפונקציה.`;

    const userPrompt = `הצע 4 יעדים שונים לטיול יום בודד אך ורק באזור: **${hint.bbox}**.
גבולות גאוגרפיים מחייבים: קווי רוחב ${hint.bounds[0]}–${hint.bounds[1]}, קווי אורך ${hint.bounds[2]}–${hint.bounds[3]}.
דוגמאות למקומות מתאימים באזור: ${hint.examples.join(", ") || "—"}.

כל יעד הוא נקודת עניין אחת (לא מסלול מרובה תחנות), שאליה הגולש יכול להגיע ולבלות בה כמה שעות.

קריטריונים:
- סגנונות מועדפים: ${body.styles.join(", ") || "מגוון"}
- הרכב: ${body.group}

לכל יעד החזר:
- name: שם מדויק של מקום אמיתי בתוך הגבולות.
- shortPitch: משפט קצר אחד (עד 12 מילים) שמסביר למה כדאי לבחור בו.
- overview: 50-80 מילים שמסבירות מה רואים, אווירה, רקע היסטורי/טבעי/נופי לפי הסגנון.
- highlights: 3-4 דגשים קצרים (פרחים בעונה, נופים, סיפור היסטורי, אוכל מקומי).
- tips: 2-4 טיפים פרקטיים לביקור.
- durationMin: כמה דקות צפוי לבלות במקום.
- category: nature | food | culture | view | activity.
- approxLat, approxLng: קואורדינטות אמיתיות בתוך הגבולות שצוינו.

אסור לכלול מקומות מחוץ לאזור.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_candidates",
              description: "Return single-destination trip candidates",
              parameters: {
                type: "object",
                properties: {
                  candidates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        shortPitch: { type: "string" },
                        overview: { type: "string" },
                        highlights: { type: "array", items: { type: "string" } },
                        tips: { type: "array", items: { type: "string" } },
                        durationMin: { type: "number" },
                        category: {
                          type: "string",
                          enum: ["nature", "food", "culture", "view", "activity"],
                        },
                        approxLat: { type: "number" },
                        approxLng: { type: "number" },
                      },
                      required: [
                        "name",
                        "shortPitch",
                        "overview",
                        "highlights",
                        "tips",
                        "category",
                        "approxLat",
                        "approxLng",
                      ],
                    },
                  },
                },
                required: ["candidates"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_candidates" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      if (aiResp.status === 429)
        return new Response(JSON.stringify({ error: "מגבלת בקשות הושגה. נסה שוב בעוד דקה." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (aiResp.status === 402)
        return new Response(JSON.stringify({ error: "אזל הקרדיט. נא להוסיף קרדיטים ב-Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      throw new Error("AI gateway error");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call returned");
    const result: AIResult = JSON.parse(toolCall.function.arguments);

    const candidates = await Promise.all(
      (result.candidates || []).map(async (c, i) => {
        let coords: { lat: number; lng: number } | null = null;
        if (GMAPS_KEY) {
          const geo = await geocode(c.name, GMAPS_KEY, hint.bounds);
          if (geo && inBounds(geo.lat, geo.lng, hint.bounds)) coords = geo;
        }
        if (!coords && inBounds(c.approxLat, c.approxLng, hint.bounds)) {
          coords = { lat: c.approxLat as number, lng: c.approxLng as number };
        }
        if (!coords) {
          console.warn("falling back for candidate", c.name);
          const fb = fallbackCandidate(hint, i);
          return {
            id: `c${i + 1}`,
            ...fb,
          };
        }
        return {
          id: `c${i + 1}`,
          name: c.name,
          shortPitch: c.shortPitch,
          overview: c.overview,
          highlights: Array.isArray(c.highlights) ? c.highlights : [],
          tips: Array.isArray(c.tips) ? c.tips : [],
          coords,
          durationMin: c.durationMin ?? 120,
          category: (c.category as string) ?? "activity",
        };
      }),
    );

    return new Response(
      JSON.stringify({
        region: body.region,
        regionLabel: hint.label,
        weatherCity: hint.weatherCity,
        planParams: { region: body.region, styles: body.styles, group: body.group },
        candidates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-trip error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
