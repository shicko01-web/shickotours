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
  stops: AIStop[];
  planB: AIPlanBStop[];
}

const REGION_HINTS: Record<string, { weatherCity: string; bbox: string }> = {
  galilee: { weatherCity: "Rosh Pina,IL", bbox: "Galilee, Northern Israel" },
  golan: { weatherCity: "Katzrin,IL", bbox: "Golan Heights, Israel" },
  jerusalem: { weatherCity: "Jerusalem,IL", bbox: "Jerusalem and surroundings, Israel" },
  negev: { weatherCity: "Mitzpe Ramon,IL", bbox: "Negev desert, Israel" },
  coast: { weatherCity: "Tel Aviv,IL", bbox: "Israeli coastal plain" },
  deadsea: { weatherCity: "Ein Gedi,IL", bbox: "Dead Sea region, Israel" },
  eilat: { weatherCity: "Eilat,IL", bbox: "Eilat and Eilat mountains, Israel" },
  carmel: { weatherCity: "Haifa,IL", bbox: "Carmel and Haifa region, Israel" },
  judea: { weatherCity: "Beit Shemesh,IL", bbox: "Judean lowlands and hills, Israel" },
};

function tripIdFromDates(start: string, end: string) {
  return `trip-${start}-${end}-${Math.random().toString(36).slice(2, 7)}`;
}

async function geocode(query: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query + ", Israel"
    )}&key=${apiKey}&language=he&region=il`;
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

    const hint = REGION_HINTS[body.region] ?? {
      weatherCity: "Tel Aviv,IL",
      bbox: body.region,
    };

    // Calculate trip length (days)
    const days = Math.max(
      1,
      Math.ceil(
        (new Date(body.endDate).getTime() - new Date(body.startDate).getTime()) / 86400000
      ) + 1
    );
    const stopsCount = Math.min(8, Math.max(3, days * (body.pace >= 4 ? 3 : body.pace >= 3 ? 2 : 2)));

    const systemPrompt = `אתה מתכנן טיולים מומחה לישראל. בנה מסלול אמיתי, זורם גיאוגרפית, עם מקומות שקיימים בפועל. כל הטקסטים בעברית. החזר רק קריאה לפונקציה.`;

    const userPrompt = `תכנן טיול ב${hint.bbox}.
- תאריכים: ${body.startDate} עד ${body.endDate} (${days} ימים)
- סגנונות מועדפים: ${body.styles.join(", ") || "מגוון"}
- הרכב: ${body.group}
- קצב: ${body.pace}/5 (1=רגוע, 5=אינטנסיבי)

בנה ${stopsCount} תחנות עיקריות (stops) ועוד 4 תחנות מקורות לתוכנית גשם (planB).
לכל תחנה ספק שם מדויק ומוכר, תיאור קצר (עד 25 מילים), משך מומלץ בדקות, וקואורדינטות מקורבות (lat/lng) של מקום אמיתי בישראל.
ל-planB ספק גם 'reason' למה זה טוב לגשם ו-'isIndoor': true.
קטגוריות חוקיות: nature, food, culture, view, activity.`;

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
                  stops: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        durationMin: { type: "number" },
                        category: {
                          type: "string",
                          enum: ["nature", "food", "culture", "view", "activity"],
                        },
                        approxLat: { type: "number" },
                        approxLng: { type: "number" },
                      },
                      required: ["name", "description", "category"],
                    },
                  },
                  planB: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
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
                      required: ["name", "description", "reason", "isIndoor"],
                    },
                  },
                },
                required: ["tripName", "weatherCity", "stops", "planB"],
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

    // 2) Geocode each stop (when key available) — fall back to AI's approx coords
    const enrichStop = async (s: AIStop) => {
      let coords = s.approxLat && s.approxLng ? { lat: s.approxLat, lng: s.approxLng } : null;
      if (GMAPS_KEY) {
        const geo = await geocode(s.name, GMAPS_KEY);
        if (geo) coords = geo;
      }
      return { coords };
    };

    const stops = await Promise.all(
      plan.stops.map(async (s, i) => {
        const { coords } = await enrichStop(s);
        return {
          id: `s${i + 1}`,
          name: s.name,
          description: s.description,
          coords: coords ?? { lat: 32.7, lng: 35.5 },
          durationMin: s.durationMin ?? 60,
          category: (s.category as Stop["category"]) ?? "activity",
        };
      })
    );

    const planB = await Promise.all(
      plan.planB.map(async (s, i) => {
        const { coords } = await enrichStop(s);
        return {
          id: `b${i + 1}`,
          name: s.name,
          description: s.description,
          coords: coords ?? { lat: 32.7, lng: 35.5 },
          durationMin: s.durationMin ?? 90,
          category: (s.category as Stop["category"]) ?? "culture",
          reason: s.reason,
          isIndoor: s.isIndoor ?? true,
        };
      })
    );

    const trip = {
      id: tripIdFromDates(body.startDate, body.endDate),
      name: plan.tripName,
      startDate: body.startDate,
      endDate: body.endDate,
      weatherCity: plan.weatherCity || hint.weatherCity,
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Type alias to satisfy `Stop["category"]` reference in the script
type Stop = { category?: "nature" | "food" | "culture" | "view" | "activity" };
