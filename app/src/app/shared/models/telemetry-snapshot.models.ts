export interface TelemetrySnapshot {
  asset_id: string;
  timestamp: string;
  temperature: number;
  pressure: number;
  vibration: number;
  power_consumption: number;
  status: string;
}
