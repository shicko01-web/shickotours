// Generate a complete trip itinerary using Gemini + Google Geocoding
// Public function (verify_jwt = false). CORS enabled.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PlanInput {
  region: string;
  startDate: string;
  endDate: string;
  styles: string[];
  group: string;
  pace: number; // 1..5
}

interface AIStop {
  name: string;
  description: string;
  details?: string;
  tips?: string[];
  durationMin?: number;
  category?: string;
  approxLat?: number;
  approxLng?: number;
}

interface AIPlanBStop extends AIStop {
  reason: string;
  isIndoor: boolean;
}

interface AIPlan {
  tripName: string;
  weatherCity: string;
  overview: string;
  highlights: string[];
  stops: AIStop[];
  planB: AIPlanBStop[];
}

interface RegionHint {
  weatherCity: string;
  bbox: string;
  /** Approximate center used as fallback when geocoding fails */
  center: { lat: number; lng: number };
  /** Bounding box for validation: [minLat, maxLat, minLng, maxLng] */
  bounds: [number, number, number, number];
  /** Concrete example places inside the region — given to the model as anchors */
  examples: string[];
}

const REGION_HINTS: Record<string, RegionHint> = {
  galilee: {
    weatherCity: "Rosh Pina,IL",
    bbox: "Galilee, Northern Israel",
    center: { lat: 32.97, lng: 35.50 },
    bounds: [32.70, 33.30, 35.10, 35.85],
    examples: ["ראש פינה", "צפת", "הר מירון", "נחל עמוד", "כפר ורדים"],
  },
  golan: {
    weatherCity: "Katzrin,IL",
    bbox: "Golan Heights, Israel",
    center: { lat: 32.99, lng: 35.69 },
    bounds: [32.70, 33.40, 35.55, 35.95],
    examples: ["קצרין", "בריכת המשושים", "נמרוד", "בנטל", "גמלא"],
  },
  jerusalem: {
    weatherCity: "Jerusalem,IL",
    bbox: "Jerusalem and surroundings, Israel",
    center: { lat: 31.78, lng: 35.22 },
    bounds: [31.65, 31.90, 35.05, 35.40],
    examples: ["העיר העתיקה ירושלים", "עין כרם", "יד ושם", "מוזיאון ישראל", "נחל שורק", "הר הצופים"],
  },
  negev: {
    weatherCity: "Mitzpe Ramon,IL",
    bbox: "Negev desert, Israel",
    center: { lat: 30.61, lng: 34.80 },
    bounds: [29.55, 31.25, 34.30, 35.30],
    examples: ["מצפה רמון", "מכתש רמון", "עין עבדת", "שדה בוקר", "פארק ירוחם", "נחל חווארים"],
  },
  coast: {
    weatherCity: "Tel Aviv,IL",
    bbox: "Israeli coastal plain",
    center: { lat: 32.08, lng: 34.78 },
    bounds: [31.60, 32.95, 34.55, 34.95],
    examples: ["נמל יפו", "פארק הירקון", "קיסריה", "נתניה", "הרצליה"],
  },
  deadsea: {
    weatherCity: "Ein Gedi,IL",
    bbox: "Dead Sea region, Israel",
    center: { lat: 31.46, lng: 35.39 },
    bounds: [31.10, 31.85, 35.25, 35.55],
    examples: ["עין גדי", "מצדה", "עין בוקק", "נחל דוד", "קומראן"],
  },
  eilat: {
    weatherCity: "Eilat,IL",
    bbox: "Eilat and Eilat mountains, Israel",
    center: { lat: 29.55, lng: 34.95 },
    bounds: [29.45, 29.95, 34.80, 35.10],
    examples: ["שמורת האלמוגים", "הר יואש", "עמודי עמרם", "נחל גישרון", "מצפור הקאניון האדום"],
  },
  carmel: {
    weatherCity: "Haifa,IL",
    bbox: "Carmel and Haifa region, Israel",
    center: { lat: 32.74, lng: 35.00 },
    bounds: [32.55, 32.90, 34.85, 35.20],
    examples: ["גני הבהאים", "מוחרקה", "עין הוד", "דליית אל-כרמל", "נחל מערות"],
  },
  judea: {
    weatherCity: "Beit Shemesh,IL",
    bbox: "Judean lowlands and hills, Israel",
    center: { lat: 31.74, lng: 34.99 },
    bounds: [31.55, 31.95, 34.75, 35.20],
    examples: ["בית גוברין", "מערת התאומים", "פארק בריטניה", "נחל שורק", "מצודת מעון"],
  },
};

function tripIdFromDates(start: string, end: string) {
  return `trip-${start}-${end}-${Math.random().toString(36).slice(2, 7)}`;
}

function inBounds(
  lat: number | undefined,
  lng: number | undefined,
  b: [number, number, number, number],
): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  return lat >= b[0] && lat <= b[1] && lng >= b[2] && lng <= b[3];
}

function fallbackRegionalStop(hint: RegionHint, index: number, isPlanB = false) {
  const name = hint.examples[index % Math.max(1, hint.examples.length)] || hint.bbox;
  const lat = Math.min(hint.bounds[1], Math.max(hint.bounds[0], hint.center.lat + (index - 1) * 0.025));
  const lng = Math.min(hint.bounds[3], Math.max(hint.bounds[2], hint.center.lng + (index % 3 - 1) * 0.025));
  return {
    name,
    description: isPlanB
      ? `חלופה רגועה ומוגנת באזור ${name}, מתאימה לשינויי מזג אוויר.`
      : `עצירה מרכזית באזור ${name}, מותאמת למסלול המבוקש.` ,
    details: `התחנה נבחרה כחלופה בטוחה בתוך גבולות האזור שבחרתם. היא שומרת את המסלול סביב ${hint.bbox}, מאפשרת ליהנות מהאופי המקומי של האזור, ומונעת גלישה לאזורים רחוקים שאינם חלק מהבקשה המקורית.`,
    tips: ["בדקו שעות פתיחה לפני ההגעה", "השאירו זמן קצר לתצפית או מנוחה", "התאימו נעליים ומים לעונה"],
    coords: { lat, lng },
    durationMin: isPlanB ? 90 : 75,
    category: isPlanB ? "culture" : "nature",
    reason: "נבחר כגיבוי אזורי בטוח במקרה שההצעה המקורית חרגה מהאזור.",
    isIndoor: isPlanB,
  };
}

async function geocode(
  query: string,
  apiKey: string,
  bounds?: [number, number, number, number],
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Bias geocoding to the region bbox so generic names resolve locally
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as PlanInput;
    if (!body?.region || !body?.startDate || !body?.endDate) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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
      center: { lat: 32.08, lng: 34.78 },
      bounds: [29.45, 33.40, 34.30, 35.95],
      examples: [],
    };

    console.log("generate-trip request", {
      region: body.region,
      bbox: hint.bbox,
      bounds: hint.bounds,
    });

    // Calculate trip length (days)
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) / 86400000,
      ) + 1,
    );
    const stopsCount = Math.min(8, Math.max(3, days * (body.pace >= 4 ? 3 : body.pace >= 3 ? 2 : 2)));

    const systemPrompt = `אתה מתכנן טיולים מומחה לישראל. תמיד מכבד את האזור שהמשתמש ביקש - אסור להציע מקומות מחוץ לאזור הזה. כל הטקסטים בעברית. החזר רק קריאה לפונקציה.`;

    const userPrompt = `תכנן טיול אך ורק באזור: **${hint.bbox}**.
גבולות גיאוגרפיים מחייבים (לא לחרוג!): קווי רוחב ${hint.bounds[0]}–${hint.bounds[1]}, קווי אורך ${hint.bounds[2]}–${hint.bounds[3]}.
דוגמאות למקומות מתאימים באזור הזה: ${hint.examples.join(", ") || "—"}.

- תאריכים: ${body.startDate} עד ${body.endDate} (${days} ימים)
- סגנונות מועדפים: ${body.styles.join(", ") || "מגוון"}
- הרכב: ${body.group}
- קצב: ${body.pace}/5 (1=רגוע, 5=אינטנסיבי)

החזר:
1) overview — פסקה (60-90 מילים) שמתארת את חוויית הטיול הכוללת: מה רואים, אווירה, מה מיוחד באזור הזה, היסטוריה/טבע/נוף לפי הסגנונות שנבחרו.
2) highlights — 3-5 דגשים קצרים (כל אחד עד 12 מילים): פרחים בעונה, נופים מיוחדים, סיפורים היסטוריים, אוכל מקומי וכד'.
3) ${stopsCount} תחנות עיקריות (stops) באזור בלבד.
4) 4 תחנות מקורות לתוכנית גשם (planB) באותו אזור.

לכל תחנה: שם מדויק, תיאור (עד 25 מילים), details — סקירה מורחבת של 45-70 מילים על מה רואים במקום, רקע היסטורי/טבעי/נופי לפי סוג הטיול, tips — 2-4 דגשים קצרים לביקור, משך בדקות, קואורדינטות אמיתיות (lat/lng) של מקום אמיתי בתוך הגבולות שצוינו. אסור להמציא קואורדינטות שמחוץ לגבולות.
ל-planB גם 'reason' למה זה טוב לגשם ו-'isIndoor': true.
קטגוריות: nature, food, culture, view, activity.`;

    // 1) Ask Gemini for itinerary via tool calling
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
              name: "build_trip",
              description: "Return a complete Israel trip itinerary",
              parameters: {
                type: "object",
                properties: {
                  tripName: { type: "string", description: "שם הטיול בעברית" },
                  weatherCity: { type: "string", description: "City,IL for weather query" },
                  overview: { type: "string", description: "פסקת סקירה של 60-90 מילים על הטיול" },
                  highlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 דגשים קצרים על האזור",
                  },
                  stops: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        details: { type: "string" },
                        tips: { type: "array", items: { type: "string" } },
                        durationMin: { type: "number" },
                        category: {
                          type: "string",
                          enum: ["nature", "food", "culture", "view", "activity"],
                        },
                        approxLat: { type: "number" },
                        approxLng: { type: "number" },
                      },
                      required: ["name", "description", "details", "tips", "category", "approxLat", "approxLng"],
                    },
                  },
                  planB: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        details: { type: "string" },
                        tips: { type: "array", items: { type: "string" } },
                        durationMin: { type: "number" },
                        category: {
                          type: "string",
                          enum: ["nature", "food", "culture", "view", "activity"],
                        },
                        approxLat: { type: "number" },
                        approxLng: { type: "number" },
                        reason: { type: "string" },
                        isIndoor: { type: "boolean" },
                      },
                      required: ["name", "description", "details", "tips", "reason", "isIndoor", "approxLat", "approxLng"],
                    },
                  },
                },
                required: ["tripName", "weatherCity", "overview", "highlights", "stops", "planB"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_trip" } },
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
    const plan: AIPlan = JSON.parse(toolCall.function.arguments);

    // 2) Resolve coordinates: try Geocoding (region-biased), then AI's approx, then region center
    const enrichStop = async (s: AIStop) => {
      let coords: { lat: number; lng: number } | null = null;
      let regionalFallback = false;

      if (GMAPS_KEY) {
        const geo = await geocode(s.name, GMAPS_KEY, hint.bounds);
        if (geo && inBounds(geo.lat, geo.lng, hint.bounds)) coords = geo;
      }

      if (!coords && inBounds(s.approxLat, s.approxLng, hint.bounds)) {
        coords = { lat: s.approxLat as number, lng: s.approxLng as number };
      }

      // Final fallback: region center (so map at least centers on the right region)
      if (!coords) {
        console.warn("falling back to region center for stop:", s.name);
        coords = hint.center;
        regionalFallback = true;
      }
      return { coords, regionalFallback };
    };

    const stops = await Promise.all(
      plan.stops.map(async (s, i) => {
        const { coords, regionalFallback } = await enrichStop(s);
        if (regionalFallback) return fallbackRegionalStop(hint, i, false);
        return {
          id: `s${i + 1}`,
          name: s.name,
          description: s.description,
          details: s.details,
          tips: Array.isArray(s.tips) ? s.tips : [],
          coords,
          durationMin: s.durationMin ?? 60,
          category: (s.category as Stop["category"]) ?? "activity",
        };
      }),
    );

    const planB = await Promise.all(
      plan.planB.map(async (s, i) => {
        const { coords, regionalFallback } = await enrichStop(s);
        if (regionalFallback) return { id: `b${i + 1}`, ...fallbackRegionalStop(hint, i, true) };
        return {
          id: `b${i + 1}`,
          name: s.name,
          description: s.description,
          details: s.details,
          tips: Array.isArray(s.tips) ? s.tips : [],
          coords,
          durationMin: s.durationMin ?? 90,
          category: (s.category as Stop["category"]) ?? "culture",
          reason: s.reason,
          isIndoor: s.isIndoor ?? true,
        };
      }),
    );

    const trip = {
      id: tripIdFromDates(body.startDate, body.endDate),
      name: plan.tripName,
      startDate: body.startDate,
      endDate: body.endDate,
      weatherCity: plan.weatherCity || hint.weatherCity,
      overview: plan.overview ?? "",
      highlights: Array.isArray(plan.highlights) ? plan.highlights : [],
      region: body.region,
      planParams: {
        region: body.region,
        styles: body.styles,
        group: body.group,
        pace: body.pace,
        startDate: body.startDate,
        endDate: body.endDate,
      },
      stops,
      planB,
    };

    return new Response(JSON.stringify({ trip }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-trip error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// Type alias to satisfy `Stop["category"]` reference in the script
type Stop = { category?: "nature" | "food" | "culture" | "view" | "activity" };
