import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TelemetrySeverity } from '../telemetry.models';

@Component({
  selector: 'app-telemetry-metric-card',
  imports: [CommonModule],
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
  readonly delta = input.required<number>();
  readonly meterPercent = input.required<number>();
  readonly severity = input.required<TelemetrySeverity>();

  protected trendPrefix(): string {
    if (this.delta() > 0) {
      return '+';
    }

    return '';
  }
}
