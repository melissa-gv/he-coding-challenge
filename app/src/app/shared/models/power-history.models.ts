export interface PowerDataPoint {
  timestamp: string;
  power_kw: number;
  efficiency: number;
}

export interface PowerHistoryResponse {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  history: PowerDataPoint[];
  forecast: PowerDataPoint[];
  metadata: Record<string, unknown>;
}
