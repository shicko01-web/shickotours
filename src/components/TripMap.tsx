import React from 'react';

interface MapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  className?: string;
}

export const Map: React.FC<MapProps> = ({
  latitude = 32.9646, // קואורדינטות ברירת מחדל (למשל, צפת)
  longitude = 35.4960,
  zoom = 14,
  className = "w-full h-[400px] rounded-lg border-0"
}) => {
  const bbox = `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <div className="w-full h-full min-h-[300px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <iframe
        title="Map"
        width="100%"
        height="100%"
        className={className}
        src={iframeSrc}
        loading="lazy"
      />
    </div>
  );
};

export default Map;
