// Hybrid AI discovery: Gemini reasoning + Google Places API (New) grounding.
// Flow: context -> AI picks search queries -> Places API fetches real data ->
// AI ranks & personalizes -> returns enriched recommendations.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  center: { lat: number; lng: number };
  regionName?: string; // e.g. "גליל עליון"
  rainActive?: boolean;
  rainProbability?: number; // 0..1
  temperatureC?: number;
  timeOfDay?: "morning" | "noon" | "afternoon" | "evening" | "night";
  tripName?: string;
  existingStops?: Array<{ name: string; category?: string }>;
  categories?: string[]; // optional user filter: food|nature|culture|view|activity|indoor
  radiusMeters?: number;
}

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  openNow?: boolean;
  weekdayText?: string[];
  types: string[];
  primaryType?: string;
  location: { lat: number; lng: number };
  editorialSummary?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  isIndoor: boolean;
}

interface Enriched extends PlaceResult {
  aiPitch: string;
  matchScore: number; // 0..100
  tags: string[];
  reason: string;
}

const INDOOR_TYPE_HINTS = [
  "museum",
  "art_gallery",
  "shopping_mall",
  "aquarium",
  "movie_theater",
  "spa",
  "bowling_alley",
  "library",
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "night_club",
  "book_store",
  "gym",
  "indoor_play_area",
  "winery",
  "performing_arts_theater",
];

const OUTDOOR_TYPE_HINTS = [
  "park",
  "natural_feature",
  "hiking_area",
  "beach",
  "tourist_attraction",
  "zoo",
  "amusement_park",
  "national_park",
  "scenic_viewpoint",
];

function isIndoorFromTypes(types: string[]): boolean {
  if (!types?.length) return false;
  const set = new Set(types);
  if (OUTDOOR_TYPE_HINTS.some((t) => set.has(t))) return false;
  return INDOOR_TYPE_HINTS.some((t) => set.has(t));
}

async function callGemini(prompt: string, systemPrompt: string, wantJson = true): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const body: Record<string, unknown> = {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  };
  if (wantJson) body.response_format = { type: "json_object" };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function searchPlaces(
  query: string,
  center: { lat: number; lng: number },
  radiusMeters: number,
  apiKey: string,
): Promise<PlaceResult[]> {
  const resp = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.currentOpeningHours.openNow",
        "places.currentOpeningHours.weekdayDescriptions",
        "places.types",
        "places.primaryType",
        "places.location",
        "places.editorialSummary",
        "places.websiteUri",
        "places.googleMapsUri",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "he",
      regionCode: "IL",
      maxResultCount: 8,
      locationBias: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: Math.min(Math.max(radiusMeters, 500), 50000),
        },
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Places search error", resp.status, text);
    return [];
  }
  const data = await resp.json();
  const places = (data.places ?? []) as Array<Record<string, unknown>>;

  return places.map((p): PlaceResult => {
    const types = (p.types as string[]) ?? [];
    const loc = p.location as { latitude: number; longitude: number } | undefined;
    const hours = p.currentOpeningHours as
      | { openNow?: boolean; weekdayDescriptions?: string[] }
      | undefined;
    const summary = p.editorialSummary as { text?: string } | undefined;
    const displayName = p.displayName as { text?: string } | undefined;
    return {
      placeId: p.id as string,
      name: displayName?.text ?? "ללא שם",
      address: (p.formattedAddress as string) ?? "",
      rating: p.rating as number | undefined,
      userRatingCount: p.userRatingCount as number | undefined,
      priceLevel: p.priceLevel as string | undefined,
      openNow: hours?.openNow,
      weekdayText: hours?.weekdayDescriptions,
      types,
      primaryType: p.primaryType as string | undefined,
      location: { lat: loc?.latitude ?? 0, lng: loc?.longitude ?? 0 },
      editorialSummary: summary?.text,
      websiteUri: p.websiteUri as string | undefined,
      googleMapsUri: p.googleMapsUri as string | undefined,
      isIndoor: isIndoorFromTypes(types),
    };
  });
}

function dedupePlaces(lists: PlaceResult[][]): PlaceResult[] {
  const seen = new Map<string, PlaceResult>();
  for (const list of lists) {
    for (const p of list) {
      if (!seen.has(p.placeId)) seen.set(p.placeId, p);
    }
  }
  return [...seen.values()];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_KEY = Deno.env.get("GOOGLE_MAPS_SERVER_KEY");
    if (!GOOGLE_KEY) throw new Error("GOOGLE_MAPS_SERVER_KEY not configured");

    const body = (await req.json()) as RequestBody;
    const {
      center,
      regionName = "",
      rainActive = false,
      rainProbability = 0,
      temperatureC,
      timeOfDay = "noon",
      tripName = "",
      existingStops = [],
      categories = [],
      radiusMeters = 12000,
    } = body;

    if (!center?.lat || !center?.lng) {
      return new Response(JSON.stringify({ error: "center lat/lng required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ STAGE 1: AI picks smart search queries ============
    const contextLines = [
      `מיקום: ${regionName || `${center.lat.toFixed(3)},${center.lng.toFixed(3)}`}`,
      `שם הטיול: ${tripName || "—"}`,
      `שעה ביום: ${timeOfDay}`,
      `גשם פעיל: ${rainActive ? "כן" : "לא"} (הסתברות ${Math.round(rainProbability * 100)}%)`,
      temperatureC !== undefined ? `טמפרטורה: ${temperatureC}°C` : "",
      categories.length ? `קטגוריות מועדפות: ${categories.join(", ")}` : "",
      existingStops.length
        ? `תחנות שכבר במסלול (להימנע מכפילות): ${existingStops.map((s) => s.name).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const planSystem =
      "אתה מתכנן טיולים מומחה בישראל. מקבל הקשר ומחזיר 4-5 שאילתות חיפוש קצרות בעברית לחיפוש מקומות ב-Google Places, מותאמות למזג האוויר ולשעה. החזר JSON בלבד בפורמט: { \"queries\": [{\"query\": \"...\", \"intent\": \"...\"}] }. כל query ספציפי (לדוגמה: 'מוזיאון אינטראקטיבי לילדים', 'בית קפה עם נוף', 'מסלול הליכה קצר'). אם גשם פעיל — רק מקומות מקורים.";

    const planPrompt = `הקשר:\n${contextLines}\n\nהחזר 4-5 שאילתות חיפוש מגוונות.`;
    let queries: Array<{ query: string; intent: string }> = [];
    try {
      const planRaw = await callGemini(planPrompt, planSystem, true);
      const parsed = JSON.parse(planRaw);
      queries = Array.isArray(parsed.queries) ? parsed.queries.slice(0, 5) : [];
    } catch (e) {
      console.error("Stage1 AI plan failed, falling back", e);
    }

    if (queries.length === 0) {
      queries = rainActive
        ? [
            { query: "מוזיאון מעניין", intent: "indoor-culture" },
            { query: "בית קפה מומלץ", intent: "indoor-food" },
            { query: "גלריה או תערוכה", intent: "indoor-culture" },
            { query: "מסעדה עם אווירה", intent: "indoor-food" },
          ]
        : [
            { query: "אטרקציה תיירותית", intent: "outdoor" },
            { query: "נקודת תצפית", intent: "view" },
            { query: "מסלול הליכה", intent: "nature" },
            { query: "מסעדה מומלצת", intent: "food" },
          ];
    }

    // ============ STAGE 2: Real Places API searches ============
    const searchResults = await Promise.all(
      queries.map((q) => searchPlaces(q.query, center, radiusMeters, GOOGLE_KEY)),
    );
    let candidates = dedupePlaces(searchResults);

    // Hard filter: if rain active, keep only indoor
    if (rainActive) candidates = candidates.filter((p) => p.isIndoor);

    // Exclude existing stops by name (loose match)
    const existingNames = new Set(existingStops.map((s) => s.name.trim()));
    candidates = candidates.filter((p) => !existingNames.has(p.name.trim()));

    // Keep top by rating*log(count) to cut AI tokens
    candidates.sort((a, b) => {
      const sa = (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 1) + 1);
      const sb = (b.rating ?? 0) * Math.log10((b.userRatingCount ?? 1) + 1);
      return sb - sa;
    });
    candidates = candidates.slice(0, 14);

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [], queries, message: "לא נמצאו מקומות תואמים" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ============ STAGE 3: AI ranks & writes personalized pitches ============
    const compact = candidates.map((c, i) => ({
      i,
      placeId: c.placeId,
      name: c.name,
      types: c.types.slice(0, 5),
      rating: c.rating,
      ratings: c.userRatingCount,
      openNow: c.openNow,
      indoor: c.isIndoor,
      summary: c.editorialSummary?.slice(0, 180),
    }));

    const rankSystem =
      "אתה עורך מדריך טיולים. מקבל רשימת מקומות אמיתיים + הקשר המטייל, ובוחר 6 הטובים ביותר. מחזיר JSON בלבד: { \"picks\": [{\"i\": <index>, \"pitch\": \"משפט שיווקי 1-2 שורות בעברית למה לבקר עכשיו\", \"reason\": \"התאמה להקשר (גשם/שעה/מסלול קיים)\", \"tags\": [\"תגית1\",\"תגית2\"], \"matchScore\": 0-100}] }. סדר לפי matchScore יורד. tags עד 3 תגיות קצרצרות בעברית.";

    const rankPrompt = `הקשר:\n${contextLines}\n\nמקומות מועמדים (JSON):\n${JSON.stringify(compact)}\n\nבחר 6, דרג, וכתוב pitch + reason בעברית.`;

    let picks: Array<{ i: number; pitch: string; reason: string; tags: string[]; matchScore: number }> = [];
    try {
      const rankRaw = await callGemini(rankPrompt, rankSystem, true);
      const parsed = JSON.parse(rankRaw);
      picks = Array.isArray(parsed.picks) ? parsed.picks : [];
    } catch (e) {
      console.error("Stage3 ranking failed, fallback to top-rated", e);
      picks = candidates.slice(0, 6).map((_, i) => ({
        i,
        pitch: "",
        reason: "",
        tags: [],
        matchScore: 60,
      }));
    }

    const recommendations: Enriched[] = picks
      .map((pick) => {
        const place = candidates[pick.i];
        if (!place) return null;
        return {
          ...place,
          aiPitch: pick.pitch || place.editorialSummary || "",
          matchScore: Math.max(0, Math.min(100, pick.matchScore ?? 60)),
          tags: (pick.tags ?? []).slice(0, 3),
          reason: pick.reason || "",
        };
      })
      .filter(Boolean) as Enriched[];

    return new Response(
      JSON.stringify({
        recommendations,
        queries,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ai-discover-places error", err);
    const msg = err instanceof Error ? err.message : "unknown";
    // Map upstream AI rate / payment errors for UX
    if (msg.includes("429")) {
      return new Response(JSON.stringify({ error: "הגעת למגבלת שימוש — נסה שוב בעוד דקה" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (msg.includes("402")) {
      return new Response(JSON.stringify({ error: "נגמרו הקרדיטים בסביבת הבינה המלאכותית" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
