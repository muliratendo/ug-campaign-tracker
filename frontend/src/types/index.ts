/**
 * Centralized type definitions for the Uganda Campaign Tracker
 * Use these types across components and API hooks to ensure type safety
 */

export interface District {
  id: string;
  name: string;
  region: string;
  location?: string; // PostGIS POINT
  created_at?: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  color_hex: string;
  created_at?: string;
}

export interface Rally {
  id: string;
  title: string;
  description: string;
  venue_name: string;
  location: string; // PostGIS POINT as "POINT(lng lat)"
  start_time: string;
  end_time?: string;
  district_id?: string;
  candidate_id?: string;
  source_url?: string;
  created_at?: string;
  updated_at?: string;
  // Joined relations
  district?: District;
  candidate?: Candidate;
}

export interface TrafficPrediction {
  id: string;
  rally_id: string;
  predicted_delay_minutes: number;
  jam_level: 'low' | 'moderate' | 'heavy' | 'critical';
  description: string;
  affected_roads: string[];
  created_at?: string;
  // Joined relation
  rally?: Rally;
}

export interface Profile {
  id: string;
  email: string;
  home_location?: string;
  notifications_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  district_id?: string;
  candidate_id?: string;
  notification_enabled: boolean;
  created_at?: string;
}

// API Response types
export interface RalliesResponse {
  data: Rally[];
  error?: string;
}

export interface TrafficResponse {
  data: TrafficPrediction[];
  error?: string;
}

// Filter types
export interface RallyFilters {
  date?: string;
  candidate?: string;
  district?: string;
}

// Map types
export interface MapMarker {
  position: [number, number]; // [lat, lng]
  rally: Rally;
}

export interface TrafficOverlay {
  position: [number, number]; // [lat, lng]
  prediction: TrafficPrediction;
  color: string;
  radius: number;
}
