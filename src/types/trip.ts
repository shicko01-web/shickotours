export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  coords: Coordinates;
  durationMin?: number;
  category?: 'nature' | 'food' | 'culture' | 'view' | 'activity';
}

export interface PlanBStop extends Stop {
  /** Why this is good for rainy weather */
  reason: string;
  isIndoor: boolean;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  /** Region/anchor used for the weather query */
  weatherCity: string;
  stops: Stop[];
  planB: PlanBStop[];
}
