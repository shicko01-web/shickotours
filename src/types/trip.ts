export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  /** Expanded review shown when the user opens a stop */
  details?: string;
  /** Practical or thematic bullets for this stop */
  tips?: string[];
  coords: Coordinates;
  durationMin?: number;
  category?: 'nature' | 'food' | 'culture' | 'view' | 'activity';
}

export interface PlanBStop extends Stop {
  /** Why this is good for rainy weather */
  reason: string;
  isIndoor: boolean;
}

export interface TripPlanParams {
  region: string;
  styles: string[];
  group: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO
  endDate: string; // ISO
  /** Region/anchor used for the weather query */
  weatherCity: string;
  /** Region key (galilee, jerusalem, …) — present for AI-generated trips */
  region?: string;
  /** AI-generated overview paragraph */
  overview?: string;
  /** Short bullet highlights (history, scenery, seasonal flora, …) */
  highlights?: string[];
  /** Original planning parameters — used to allow regeneration */
  planParams?: TripPlanParams;
  stops: Stop[];
  planB: PlanBStop[];
}

/** A single-destination candidate suggested by the AI, before the user picks one. */
export interface TripCandidate {
  id: string;
  name: string;
  shortPitch: string;
  overview: string;
  highlights: string[];
  tips: string[];
  coords: Coordinates;
  durationMin?: number;
  category?: Stop['category'];
}

export interface CandidateBundle {
  region: string;
  regionLabel: string;
  weatherCity: string;
  planParams: TripPlanParams;
  candidates: TripCandidate[];
}
