import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TelemetryMetricRow } from '../../../shared/models/telemetry-metric.models';

@Component({
  selector: 'app-telemetry-asset-card',
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './telemetry-asset-card.component.html',
  styleUrl: './telemetry-asset-card.component.scss'
})
export class TelemetryAssetCardComponent {
  readonly assetName = input.required<string>();
  readonly assetType = input.required<string>();
  readonly status = input.required<string>();
  readonly metrics = input.required<TelemetryMetricRow[]>();

  protected statusSeverity(): 'success' | 'warn' | 'danger' | 'info' {
    const status = this.status().toLowerCase();

    if (status === 'operational') {
      return 'success';
    }

    if (status === 'standby') {
      return 'warn';
    }

    if (status === 'maintenance') {
      return 'danger';
    }

    return 'info';
  }
}
