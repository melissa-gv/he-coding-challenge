import { Asset } from '../shared/models/asset.models';

export type TelemetryAsset = Asset;

export interface TelemetrySnapshot {
  asset_id: string;
  timestamp: string;
  temperature: number;
  pressure: number;
  vibration: number;
  power_consumption: number;
  status: string;
}

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

export type TelemetryMetricKey =
  | 'temperature'
  | 'pressure'
  | 'vibration'
  | 'power_consumption';

export type TelemetryMetricRow = TelemetryMetric & { value: number };

export interface TelemetryMetric {
  key: TelemetryMetricKey;
  label: string;
  unit: string;
}

export const TELEMETRY_METRICS: TelemetryMetric[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: 'C°'
  },
  {
    key: 'pressure',
    label: 'Pressure',
    unit: 'psi'
  },
  {
    key: 'vibration',
    label: 'Vibration',
    unit: 'mm/s'
  },
  {
    key: 'power_consumption',
    label: 'Power Draw',
    unit: 'kW'
  }
];
