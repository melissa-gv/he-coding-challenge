import { TelemetrySnapshot } from './telemetry-snapshot.models';

export type TelemetryMetricKey = Exclude<
  keyof TelemetrySnapshot,
  'asset_id' | 'timestamp' | 'status'
>;

export interface TelemetryMetric {
  key: TelemetryMetricKey;
  label: string;
  unit: string;
}

export type TelemetryMetricRow = TelemetryMetric & { value: number };

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
