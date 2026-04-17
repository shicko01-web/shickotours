import { Clock, Navigation, MapPin, Tag } from 'lucide-react';
import type { PlanBStop, Stop } from '@/types/trip';
import { Button } from '@/components/ui/button';

interface StopCardProps {
  stop: Stop | PlanBStop;
  index: number;
  variant?: 'primary' | 'planB';
}

const categoryLabel: Record<string, string> = {
  nature: 'טבע',
  food: 'אוכל',
  culture: 'תרבות',
  view: 'תצפית',
  activity: 'פעילות',
};

export function StopCard({ stop, index, variant = 'primary' }: StopCardProps) {
  const isPlanB = variant === 'planB';
  const planBStop = isPlanB ? (stop as PlanBStop) : null;

  const wazeUrl = `https://waze.com/ul?ll=${stop.coords.lat},${stop.coords.lng}&navigate=yes`;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${stop.coords.lat},${stop.coords.lng}`;

  return (
    <article
      className={`animate-fade-in rounded-2xl bg-card p-4 shadow-soft transition-smooth hover:shadow-card ${
        isPlanB ? 'border border-rain/20' : 'border border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
            isPlanB ? 'bg-rain' : 'gradient-sky'
          }`}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-tight text-foreground">{stop.name}</h3>
            {stop.category && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                <Tag className="h-2.5 w-2.5" />
                {categoryLabel[stop.category]}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stop.description}</p>

          {planBStop?.reason && (
            <div className="mt-2 rounded-lg bg-rain/10 px-2.5 py-1.5 text-[11px] text-rain">
              <strong className="font-semibold">למה בגשם:</strong> {planBStop.reason}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {stop.durationMin && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {Math.round(stop.durationMin / 60 * 10) / 10} שעות
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {stop.coords.lat.toFixed(3)}, {stop.coords.lng.toFixed(3)}
            </span>
          </div>

          <div className="mt-3 flex gap-2 print:hidden">
            <Button asChild size="sm" variant="default" className="flex-1 gap-1.5">
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-3.5 w-3.5" />
                Waze
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5">
              <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-3.5 w-3.5" />
                Maps
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
