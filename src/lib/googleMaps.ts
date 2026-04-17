/**
 * Singleton Google Maps JS API loader.
 * Loads `maps`, `marker`, and `places` libraries once, returns a promise.
 */
const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let loadPromise: Promise<typeof google> | null = null;

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
  if (!GMAPS_KEY) return Promise.reject(new Error('missing-api-key'));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const cbName = `__shickoGmapsCb_${Date.now()}`;
    (window as any)[cbName] = () => {
      resolve((window as any).google);
      delete (window as any)[cbName];
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
