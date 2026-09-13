import React from 'react';

interface MapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
  locations?: Array<{ lat: number; lng: number; title?: string }>;
}

export const TripMap: React.FC<MapProps> = ({
  latitude = 32.9646,
  longitude = 35.4960,
  className = "w-full h-[400px] rounded-lg border-0"
}) => {
  const bbox = `${longitude - 0.02},${latitude - 0.02},${longitude + 0.02},${latitude + 0.02}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="w-full h-full min-h-[300px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <iframe
        title="Trip Map"
        width="100%"
        height="100%"
        className={className}
        src={iframeSrc}
        loading="lazy"
      />
    </div>
  );
};

export default TripMap;

