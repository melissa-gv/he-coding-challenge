import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-telemetry-metric-card',
  imports: [CommonModule, CardModule, TagModule],
  templateUrl: './telemetry-metric-card.component.html',
  styleUrl: './telemetry-metric-card.component.scss'
})
export class TelemetryMetricCardComponent {
  readonly assetName = input.required<string>();
  readonly assetType = input.required<string>();
  readonly status = input.required<string>();

  readonly metricLabel = input.required<string>();
  readonly unit = input.required<string>();
  readonly value = input.required<number>();

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
