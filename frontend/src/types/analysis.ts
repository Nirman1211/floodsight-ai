export interface SettlementImpact {
  id: string;
  name: string;
  coordinates: [number, number];
  population_est: number;
  baseline_nearest_facility: string;
  baseline_distance_km: number;
  post_event_accessible: boolean;
  status: 'newly_cut_off' | 'intact_access' | 'baseline_isolated';
  alternative_route_available: boolean;
}

export interface InfrastructureSummary {
  total_roads_analyzed_km: number;
  exposed_road_length_km: number;
  percentage_road_disrupted: number;
  total_bridges: number;
  exposed_bridges_count: number;
  total_buildings: number;
  exposed_buildings_count: number;
}

export interface AnalysisResult {
  job_id: string;
  name: string;
  event_date: string;
  bbox: number[];
  total_flood_area_km2: number;
  total_flood_area_hectares: number;
  infrastructure: InfrastructureSummary;
  settlements: SettlementImpact[];
  cut_off_settlements_count: number;
  flood_geojson: any;
  exposed_roads_geojson: any;
  exposed_buildings_geojson: any;
  flood_flow_path_geojson?: any;
  attributions: string[];
  pdf_report_url?: string;
  created_at: string;
}

export interface CopilotResponse {
  answer: string;
  grounded_metrics: Record<string, any>;
  observation_dates: Record<string, string>;
  confidence_statement: string;
}
