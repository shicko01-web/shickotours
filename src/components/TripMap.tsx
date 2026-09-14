import React, { useEffect, useMemo } from 'react';
import type { Stop, PlanBStop } from '@/types/trip';

interface TripMapProps {
  stops: Stop[];
  planBStops?: PlanBStop[];
  highlightPlanB?: boolean;
  onMapReady?: (map: google.maps.Map | null) => void;
  className?: string;
}

export const TripMap: React.FC<TripMapProps> = ({
  stops,
  planBStops = [],
  highlightPlanB = false,
  onMapReady,
}) => {
  const activeStops = useMemo(
    () => (highlightPlanB && planBStops.length > 0 ? planBStops : stops),
    [highlightPlanB, planBStops, stops]
  );

  const center = useMemo(() => {
    if (activeStops.length === 0) return { lat: 32.7, lng: 35.5 };
    const first = activeStops[0].coords;
    return { lat: first.lat, lng: first.lng };
  }, [activeStops]);

  const bbox = useMemo(() => {
    const padding = 0.02;
    return `${center.lng - padding},${center.lat - padding},${center.lng + padding},${center.lat + padding}`;
  }, [center]);

  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;

  useEffect(() => {
    // OpenStreetMap embed does not expose a programmatic map instance.
    // Notify parent with null so PDF export can fall back gracefully.
    onMapReady?.(null);
  }, [onMapReady]);

  return (
    <div className="w-full h-full min-h-[300px] overflow-hidden rounded-xl border border-border shadow-sm">
      <iframe
        title="Trip Map"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        src={iframeSrc}
        loading="lazy"
      />
    </div>
  );
};

export default TripMap;
