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

export type TelemetryMetricKey =
  | 'temperature'
  | 'pressure'
  | 'vibration'
  | 'power_consumption';

export interface TelemetryMetricDefinition {
  key: TelemetryMetricKey;
  label: string;
  unit: string;
}

export const TELEMETRY_METRICS: TelemetryMetricDefinition[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: 'Celsius'
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
