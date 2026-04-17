import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import type { Stop } from '@/types/trip';
import { loadGoogleMaps, hasGoogleMapsKey } from '@/lib/googleMaps';

interface TripMapProps {
  stops: Stop[];
  /** When true, also draws Plan B stops with a different color */
  planBStops?: Stop[];
  highlightPlanB?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
}

export function TripMap({ stops, planBStops = [], highlightPlanB = false, onMapReady }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasGoogleMapsKey()) {
      setError('missing-api-key');
      return;
    }
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new g.maps.Map(containerRef.current, {
            center: stops[0]?.coords ?? { lat: 32.7, lng: 35.5 },
            zoom: 10,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
            ],
          });
          onMapReady?.(mapRef.current);
        }
      })
      .catch((e) => setError(e.message ?? 'load-failed'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers + route whenever stops change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    const g = window.google;
    const markers: google.maps.Marker[] = [];
    const bounds = new g.maps.LatLngBounds();

    const visibleStops = highlightPlanB && planBStops.length ? planBStops : stops;
    const accentColor = highlightPlanB ? '#2563eb' : '#0891b2';

    visibleStops.forEach((s, i) => {
      const marker = new g.maps.Marker({
        position: s.coords,
        map,
        label: { text: String(i + 1), color: '#fff', fontWeight: '700' },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: accentColor,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: s.name,
      });
      const info = new g.maps.InfoWindow({
        content: `<div dir="rtl" style="font-family:Heebo,sans-serif;padding:4px 6px;max-width:220px"><strong>${s.name}</strong><br/><span style="color:#475569;font-size:12px">${s.description}</span></div>`,
      });
      marker.addListener('click', () => info.open({ map, anchor: marker }));
      markers.push(marker);
      bounds.extend(s.coords);
    });

    let polyline: google.maps.Polyline | null = null;
    if (visibleStops.length > 1) {
      polyline = new g.maps.Polyline({
        path: visibleStops.map((s) => s.coords),
        geodesic: true,
        strokeColor: accentColor,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map,
      });
      map.fitBounds(bounds, 60);
    } else if (visibleStops.length === 1) {
      map.setCenter(visibleStops[0].coords);
      map.setZoom(13);
    }

    return () => {
      markers.forEach((m) => m.setMap(null));
      polyline?.setMap(null);
    };
  }, [stops, planBStops, highlightPlanB]);

  if (error === 'missing-api-key') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl bg-muted p-6 text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-semibold">חסר מפתח Google Maps</p>
        <p className="text-xs text-muted-foreground">
          הוסף <code className="rounded bg-background px-1">VITE_GOOGLE_MAPS_API_KEY</code> לקובץ <code className="rounded bg-background px-1">.env</code> והפעל מחדש.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl bg-muted p-6 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm">לא ניתן לטעון את המפה.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
