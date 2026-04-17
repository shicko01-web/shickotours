import type { Trip } from '@/types/trip';

/**
 * Default seed trip — Galilee adventure.
 * Users can edit / replace this in the app; persisted to localStorage.
 */
export const SEED_TRIP: Trip = {
  id: 'seed-galilee',
  name: 'מסע בגליל העליון',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
  weatherCity: 'Rosh Pina,IL',
  stops: [
    {
      id: 's1',
      name: 'שמורת נחל עיון',
      description: 'מסלול מים יפהפה עם מפלים מרשימים. מתאים לכל המשפחה.',
      coords: { lat: 33.2697, lng: 35.5783 },
      durationMin: 120,
      category: 'nature',
    },
    {
      id: 's2',
      name: 'מצפה אדמית',
      description: 'נקודת תצפית מרהיבה אל הר חרמון והכינרת.',
      coords: { lat: 33.0539, lng: 35.4581 },
      durationMin: 45,
      category: 'view',
    },
    {
      id: 's3',
      name: 'ארוחת צהריים — דאג ע"ש בני',
      description: 'מסעדת דגים אגדית על שפת הכינרת.',
      coords: { lat: 32.8773, lng: 35.5904 },
      durationMin: 90,
      category: 'food',
    },
    {
      id: 's4',
      name: 'חוות בראשית',
      description: 'מתחם פסטורלי עם בעלי חיים, מסלולי הליכה ונופים.',
      coords: { lat: 33.0117, lng: 35.5314 },
      durationMin: 75,
      category: 'activity',
    },
    {
      id: 's5',
      name: 'ראש פינה — הסמטאות העתיקות',
      description: 'סיור באבן הירושלמית, גלריות וקפה ערב.',
      coords: { lat: 32.9686, lng: 35.5394 },
      durationMin: 90,
      category: 'culture',
    },
  ],
  planB: [
    {
      id: 'b1',
      name: 'מוזיאון הקופסה — כפר ורדים',
      description: 'מוזיאון אינטראקטיבי לילדים ולמבוגרים, חוויה מקורה מלאה.',
      coords: { lat: 32.9925, lng: 35.2747 },
      durationMin: 120,
      category: 'culture',
      reason: 'חוויה תחת קורת גג עם פעילויות לכל הגילאים.',
      isIndoor: true,
    },
    {
      id: 'b2',
      name: 'יקב רמת הגולן — סיור וטעימות',
      description: 'סיור מודרך ביקב המוביל בארץ עם טעימות יין.',
      coords: { lat: 33.1789, lng: 35.7644 },
      durationMin: 90,
      category: 'culture',
      reason: 'סיור פנימי מקורה, אטרקטיבי גם בגשם.',
      isIndoor: true,
    },
    {
      id: 'b3',
      name: 'חמי טבריה — ספא',
      description: 'מעיינות חמים מרגיעים ומתחם בריכות מקורה.',
      coords: { lat: 32.7706, lng: 35.5511 },
      durationMin: 150,
      category: 'activity',
      reason: 'מים חמים בגשם — קומבינציה מנצחת.',
      isIndoor: true,
    },
    {
      id: 'b4',
      name: 'בית אוסישקין — קיבוץ דן',
      description: 'מוזיאון טבע ייחודי לחבל הצפון.',
      coords: { lat: 33.2378, lng: 35.6517 },
      durationMin: 90,
      category: 'culture',
      reason: 'חוויה לימודית-מוזיאלית מקורה.',
      isIndoor: true,
    },
  ],
};
