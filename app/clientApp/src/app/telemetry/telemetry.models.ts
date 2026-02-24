export interface TelemetryAsset {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  last_updated: string;
}

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
  warningThreshold: number;
  maxScale: number;
}

export type TelemetrySeverity = 'nominal' | 'warning';

export const TELEMETRY_METRICS: TelemetryMetricDefinition[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: 'C',
    warningThreshold: 85,
    maxScale: 120
  },
  {
    key: 'pressure',
    label: 'Pressure',
    unit: 'psi',
    warningThreshold: 145,
    maxScale: 220
  },
  {
    key: 'vibration',
    label: 'Vibration',
    unit: 'mm/s',
    warningThreshold: 4.5,
    maxScale: 8
  },
  {
    key: 'power_consumption',
    label: 'Power Draw',
    unit: 'kW',
    warningThreshold: 90,
    maxScale: 220
  }
];
