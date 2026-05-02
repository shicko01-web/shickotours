import { useState } from 'react';
import { ChevronDown, Clock, Navigation, MapPin, Tag } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);

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

          {(stop.details || (stop.tips && stop.tips.length > 0)) && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="flex w-full items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-right text-xs font-bold text-secondary-foreground transition-smooth hover:bg-secondary"
                aria-expanded={expanded}
              >
                <span>{expanded ? 'סגור סקירה' : 'לסקירה ודגשים'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
              {expanded && (
                <div className="mt-2 rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground/85">
                  {stop.details && <p>{stop.details}</p>}
                  {stop.tips && stop.tips.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      {stop.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

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
