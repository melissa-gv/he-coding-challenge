export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const MAINTENANCE_MODES = ['scheduled', 'predictive', 'reactive'] as const;
export type MaintenanceMode = (typeof MAINTENANCE_MODES)[number];

export const OPERATING_MODES = ['continuous', 'intermittent', 'on_demand'] as const;
export type OperatingMode = (typeof OPERATING_MODES)[number];

export interface AssetConfiguration {
  asset_id: string;
  name: string;
  priority: PriorityLevel;
  maintenance_mode: MaintenanceMode;
  operating_mode: OperatingMode;
  maintenance_interval_days: number;
  max_runtime_hours: number;
  warning_threshold_percent: number;
  max_temperature_celsius: number;
  max_pressure_psi: number;
  efficiency_target_percent: number;
  power_factor: number;
  load_capacity_percent: number;
  alert_email: string;
  location: string;
  notes?: string | null;
}
