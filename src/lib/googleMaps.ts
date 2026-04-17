/// <reference types="google.maps" />

/**
 * Singleton Google Maps JS API loader.
 * Loads `maps`, `marker`, and `places` libraries once.
 */
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let loadPromise: Promise<typeof globalThis.google> | null = null;

export function loadGoogleMaps(): Promise<typeof globalThis.google> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
  if (!GMAPS_KEY) return Promise.reject(new Error('missing-api-key'));
  const w = window as unknown as { google?: typeof globalThis.google };
  if (w.google?.maps) return Promise.resolve(w.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const cbName = `__shickoGmapsCb_${Date.now()}`;
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      resolve((window as unknown as { google: typeof globalThis.google }).google);
      delete (window as unknown as Record<string, unknown>)[cbName];
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places,marker&language=he&region=IL&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('gmaps-load-failed'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function hasGoogleMapsKey() {
  return Boolean(GMAPS_KEY);
}
