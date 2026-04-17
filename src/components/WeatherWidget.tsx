import { Cloud, CloudRain, Loader2, Sun, AlertCircle } from 'lucide-react';
import type { WeatherSnapshot } from '@/hooks/useWeather';

interface WeatherWidgetProps {
  data: WeatherSnapshot | null;
  loading: boolean;
  error: string | null;
}

function pickIcon(icon: string, rainProb: number) {
  if (rainProb > 0.4 || icon.startsWith('09') || icon.startsWith('10') || icon.startsWith('11'))
    return CloudRain;
  if (icon.startsWith('01') || icon.startsWith('02')) return Sun;
  return Cloud;
}

export function WeatherWidget({ data, loading, error }: WeatherWidgetProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white/90 backdrop-blur">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>טוען מזג אוויר…</span>
      </div>
    );
  }

  if (error === 'missing-api-key') {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white/90 backdrop-blur">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>חסר מפתח OpenWeather</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white/90 backdrop-blur">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>אין נתוני מזג אוויר</span>
      </div>
    );
  }

  const Icon = pickIcon(data.icon, data.rainProbability);
  const popPct = Math.round(data.rainProbability * 100);

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-white backdrop-blur-md">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{data.tempC}°</span>
      <span className="text-xs opacity-90">·</span>
      <span className="text-xs opacity-90">{data.city}</span>
      {popPct > 0 && (
        <>
          <span className="text-xs opacity-90">·</span>
          <span className="text-xs font-medium">💧 {popPct}%</span>
        </>
      )}
    </div>
  );
}
