import { forwardRef } from 'react';
import { CloudRain, AlertTriangle } from 'lucide-react';

interface RainAlertBannerProps {
  manual: boolean;
  rainProbability?: number;
  rainMm?: number;
}

export const RainAlertBanner = forwardRef<HTMLDivElement, RainAlertBannerProps>(function RainAlertBanner(
  { manual, rainProbability, rainMm },
  ref
) {
  const pct = rainProbability != null ? Math.round(rainProbability * 100) : null;

  return (
    <div
      ref={ref}
      role="alert"
      className="animate-fade-in flex items-start gap-3 rounded-2xl bg-rain p-4 text-rain-foreground shadow-card"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 animate-rain-pulse">
        <CloudRain className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-bold">
          <AlertTriangle className="h-4 w-4" />
          {manual ? 'תוכנית גשם הופעלה ידנית' : 'התראת גשם — תוכנית B מומלצת'}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-white/90">
          {manual
            ? 'בחרת להפעיל את תוכנית הגשם. המפה והאטרקציות מציגות חלופות מקורות.'
            : `סבירות גבוהה לגשם היום${pct !== null ? ` (${pct}%)` : ''}${
                rainMm ? ` · עד ${rainMm} מ"מ` : ''
              }. עברנו אוטומטית לתוכנית מקורה.`}
        </p>
      </div>
    </div>
  );
}
