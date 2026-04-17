# shickotours 🧭

מתכנן הטיולים החכם — מפת מסלול אינטראקטיבית, תחזית מזג אוויר חיה, ותוכנית B אוטומטית לימי גשם.

> Mobile-first · RTL Hebrew · React + Vite + TypeScript · Tailwind CSS

## ✨ Features

- 🗺️ **Interactive map** — Google Maps with custom markers, route polyline, info windows
- 🌦️ **Live weather widget** — current temp + rain probability via OpenWeatherMap
- ☔ **Smart Plan B** — automatically swaps to indoor alternatives when rain probability > 40%
- 🚨 **Manual rain mode** — "הפעל תוכנית גשם ידנית" toggle forces the indoor plan instantly
- 📍 **Nearby discovery** — Google Places API surfaces extra attractions around your current waypoint
- 🧭 **One-tap navigation** — every stop has Waze + Google Maps deep links
- 📄 **PDF export** — downloads a printable trip guide for the *currently active* plan
- 💾 **Local-first** — your trip is stored in `localStorage`; no account needed

## 🚀 Getting Started

```bash
npm install
cp .env.example .env   # then fill in your API keys
npm run dev
```

### Required API Keys

| Key | Where to get it | Notes |
|-----|----------------|-------|
| `VITE_OPENWEATHER_API_KEY` | https://openweathermap.org/api | Free tier (1000 calls/day) is plenty |
| `VITE_GOOGLE_MAPS_API_KEY` | https://console.cloud.google.com/google/maps-apis | Enable **Maps JavaScript API** + **Places API**. **Restrict by HTTP referrer!** |

## 🌐 Deploying to GitHub Pages

GitHub Pages serves your app from a sub-path like `https://username.github.io/repo-name/`,
so the build needs the right `base`:

```bash
VITE_BASE=/your-repo-name/ npm run build
```

The included GitHub Actions workflow does this automatically.

### Setup steps

1. Push this repo to GitHub
2. **Settings → Secrets and variables → Actions** → add two repository secrets:
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`
3. **Settings → Pages** → set **Source** to **GitHub Actions**
4. Push to `main` — `.github/workflows/deploy.yml` builds and deploys automatically

> ⚠️ **Security note**: Vite env vars prefixed with `VITE_` are bundled into your client JS.
> Anyone visiting your site can read them. Always restrict your Google Maps key by HTTP referrer
> and your OpenWeather key by quota in their respective dashboards.

## 🏗️ Tech Stack

- **React 18** + **Vite 5** + **TypeScript**
- **Tailwind CSS** (semantic design tokens, RTL-first, Heebo + Assistant fonts)
- **React Context** for the rain-mode state
- **html2pdf.js** for PDF export
- **Google Maps JavaScript API** + **Places API**
- **OpenWeatherMap** Forecast API
- **Lucide** icons

## 📁 Project structure

```
src/
├── components/         # TripMap, WeatherWidget, StopCard, NearbyAttractions, RainAlertBanner
├── contexts/           # RainModeContext (auto + manual rain state)
├── hooks/              # useTrip (localStorage), useWeather
├── lib/                # googleMaps loader, pdfExport
├── data/seedTrip.ts    # Default Galilee itinerary + Plan B
├── types/trip.ts       # Trip / Stop type definitions
└── pages/Index.tsx     # Main shell
```

## 📝 License

MIT
