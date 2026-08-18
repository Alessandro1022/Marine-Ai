// Empire Marine AI — domain types
// © Aetos Systems

export type Language = "sv" | "en";
export type SubscriptionPlan = "free" | "pro" | "premium";
export type BoatType = "motorboat" | "sailboat" | "fishing_boat" | "pwc";
export type RiskLevel = "green" | "yellow" | "red";
export type AIProvider = "openai" | "gemini";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  language: Language;
  subscription_plan: SubscriptionPlan;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  boat_id: string;
  trip_date: string;
  start_time: string;           // NYT
  end_time: string;             // NYT
  start_location: string;
  destination: string;
  start_lat: number;            // NYT
  start_lon: number;            // NYT
  end_lat: number;              // NYT
  end_lon: number;              // NYT
  distance_nm: number;
  duration_minutes: number;
  avg_speed_knots: number;      // NYT
  fuel_used_liters: number;
  fuel_cost_sek: number;        // NYT
  weather_summary: string | null;
  notes: string | null;
  track_geojson: {              // NYT
    type: "LineString";
    coordinates: [number, number][];
  } | null;
  photo_urls?: string[];        // NYT
  created_at: string;
  updated_at: string;           // NYT
}

export interface Trip {
  id: string;
  user_id: string;
  boat_id: string | null;
  trip_date: string;
  start_location: string;
  destination: string;
  distance_nm: number | null;
  duration_minutes: number | null;
  fuel_used_liters: number | null;
  weather_summary: string | null;
  notes: string | null;
  created_at: string;
}

export type MaintenanceType =
  | "oil_change"
  | "engine_service"
  | "battery_replacement"
  | "impeller_replacement"
  | "hull_cleaning"
  | "winter_storage"
  | "other";

export interface MaintenanceItem {
  id: string;
  user_id: string;
  boat_id: string | null;
  maintenance_type: MaintenanceType;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  remind: boolean;
  created_at: string;
}

export interface Marina {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  has_fuel: boolean;
  has_restaurant: boolean;
  has_electricity: boolean;
  is_guest_harbor: boolean;
  has_water: boolean;
  has_wifi: boolean;
  region: string | null;
}

export interface SavedLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "favorite" | "fuel_station" | "anchorage" | "custom";
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  kind:
    | "maintenance"
    | "weather"
    | "safety"
    | "subscription"
    | "trip";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface WeatherSnapshot {
  temperature_c: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  wave_height_m: number | null;
  visibility_m: number | null;
  precipitation_mm: number;
  risk: RiskLevel;
  fetched_at: string;
}

export interface RouteEstimate {
  distance_nm: number;
  eta_minutes: number;
  fuel_liters: number;
  fuel_cost_sek: number;
  risk: RiskLevel;
}

export interface FuelEstimate {
  consumption_liters: number;
  cost_sek: number;
  reserve_liters: number;
  total_recommended_liters: number;
}
