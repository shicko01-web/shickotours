import type { Trip, Stop, PlanBStop } from '@/types/trip';
import type { WeatherSnapshot } from '@/hooks/useWeather';

interface ExportOptions {
  trip: Trip;
  rainActive: boolean;
  weather: WeatherSnapshot | null;
  /** Optional data URL for an embedded map snapshot */
  mapSnapshotUrl?: string | null;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStops(stops: (Stop | PlanBStop)[], rainActive: boolean) {
  return stops
    .map((s, i) => {
      const reason = (s as PlanBStop).reason;
      return `
      <div class="stop">
        <div class="badge ${rainActive ? 'rain' : 'sun'}">${i + 1}</div>
        <div class="stop-body">
          <h3>${escapeHtml(s.name)}</h3>
          <p>${escapeHtml(s.description)}</p>
          ${reason ? `<p class="reason"><strong>למה בגשם:</strong> ${escapeHtml(reason)}</p>` : ''}
          <p class="meta">
            ${s.durationMin ? `⏱ ${Math.round((s.durationMin / 60) * 10) / 10} שעות · ` : ''}
            📍 ${s.coords.lat.toFixed(3)}, ${s.coords.lng.toFixed(3)}
          </p>
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Builds a printable HTML document (RTL, Hebrew) for the active plan and
 * generates a PDF via html2pdf.js.
 */
export async function exportTripPdf({ trip, rainActive, weather, mapSnapshotUrl }: ExportOptions) {
  const html2pdf = (await import('html2pdf.js')).default;

  const stops = rainActive ? trip.planB : trip.stops;
  const planLabel = rainActive ? 'תוכנית B — מקורה' : 'תוכנית מקורית';
  const weatherLine = weather
    ? `${weather.tempC}° · ${escapeHtml(weather.description)} · גשם ${Math.round(
        weather.rainProbability * 100
      )}%`
    : 'אין נתוני מזג אוויר';

  const container = document.createElement('div');
  container.dir = 'rtl';
  container.lang = 'he';
  container.style.cssText = 'font-family: Heebo, Arial, sans-serif; color:#0f172a; padding:24px; max-width:780px;';
  container.innerHTML = `
    <style>
      h1 { font-size: 24px; margin: 0 0 4px; color: #0e7490; }
      .sub { color:#64748b; font-size: 13px; margin-bottom: 16px; }
      .header-card { background: linear-gradient(135deg,#0891b2,#22d3ee); color:white; padding:18px; border-radius:14px; margin-bottom:18px; }
      .header-card h1 { color:white; }
      .header-card .sub { color:rgba(255,255,255,0.9); }
      .plan-tag { display:inline-block; background:rgba(255,255,255,0.2); padding:4px 10px; border-radius:999px; font-size:12px; font-weight:600; }
      .map-snap { width:100%; border-radius:12px; margin:12px 0 18px; }
      .stop { display:flex; gap:12px; padding:12px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:10px; page-break-inside: avoid; }
      .badge { width:34px; height:34px; border-radius:999px; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
      .badge.sun { background:#0891b2; }
      .badge.rain { background:#2563eb; }
      .stop h3 { margin:0 0 4px; font-size:15px; }
      .stop p { margin:0 0 4px; font-size:12px; color:#475569; line-height:1.5; }
      .reason { background:#dbeafe; color:#1e40af; padding:6px 8px; border-radius:6px; }
      .meta { color:#94a3b8 !important; font-size:11px !important; }
      .footer { margin-top:20px; text-align:center; font-size:11px; color:#94a3b8; }
    </style>

    <div class="header-card">
      <span class="plan-tag">${planLabel}</span>
      <h1>${escapeHtml(trip.name)}</h1>
      <div class="sub">${escapeHtml(trip.startDate)} — ${escapeHtml(trip.endDate)} · ${weatherLine}</div>
    </div>

    ${mapSnapshotUrl ? `<img class="map-snap" src="${mapSnapshotUrl}" alt="Map" />` : ''}

    <h2 style="font-size:16px; margin: 8px 0 12px; color:#0f172a;">${
      rainActive ? '🌧 תחנות תוכנית B' : '☀️ תחנות המסלול'
    }</h2>
    ${renderStops(stops, rainActive)}

    <div class="footer">נוצר על ידי shickotours · ${new Date().toLocaleDateString('he-IL')}</div>
  `;

  document.body.appendChild(container);

  try {
    await html2pdf()
      .from(container)
      .set({
        margin: 8,
        filename: `${trip.name.replace(/\s+/g, '-')}-${rainActive ? 'PlanB' : 'Original'}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  } finally {
    container.remove();
  }
}
