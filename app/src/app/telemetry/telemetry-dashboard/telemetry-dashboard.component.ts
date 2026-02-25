import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AppDataStoreService } from '../../shared/data-store/app-data-store.service';
import { TelemetryAssetSelectorComponent } from '../telemetry-asset-selector/telemetry-asset-selector.component';
import { TelemetryMetricCardComponent } from '../telemetry-metric-card/telemetry-metric-card.component';
import {
  TELEMETRY_METRICS,
  TelemetryMetricDefinition,
  TelemetryMetricKey,
  TelemetrySeverity
} from '../telemetry.models';

@Component({
  selector: 'app-telemetry-dashboard',
  imports: [CommonModule, ButtonModule, MessageModule, TelemetryAssetSelectorComponent, TelemetryMetricCardComponent],
  templateUrl: './telemetry-dashboard.component.html',
  styleUrl: './telemetry-dashboard.component.scss'
})
export class TelemetryDashboardComponent {
  private readonly dataStore = inject(AppDataStoreService);

  protected readonly metrics: TelemetryMetricDefinition[] = TELEMETRY_METRICS;

  protected readonly assets = this.dataStore.assets;
  protected readonly selectedAssetIds = this.dataStore.selectedAssetIds;
  protected readonly selectedAssets = this.dataStore.selectedAssets;

  protected readonly isLoadingAssets = this.dataStore.isLoadingAssets;
  protected readonly isLoadingTelemetry = this.dataStore.isLoadingTelemetry;

  protected readonly assetsError = this.dataStore.assetsError;
  protected readonly telemetryError = this.dataStore.telemetryError;
  protected readonly lastLiveUpdate = this.dataStore.lastLiveUpdate;

  protected readonly hasTelemetryData = this.dataStore.hasTelemetryData;

  protected onSelectedAssetIdsChange(selectedIds: string[]): void {
    this.dataStore.setSelectedAssetIds(selectedIds);
  }

  protected refreshTelemetry(): void {
    this.dataStore.refreshTelemetry();
  }

  protected metricValue(assetId: string, key: TelemetryMetricKey): number {
    const telemetry = this.dataStore.telemetryByAssetId()[assetId];
    return telemetry?.[key] ?? 0;
  }

  protected metricDelta(assetId: string, key: TelemetryMetricKey): number {
    const previousTelemetry = this.dataStore.previousTelemetryByAssetId()[assetId];
    const currentTelemetry = this.dataStore.telemetryByAssetId()[assetId];

    if (!previousTelemetry || !currentTelemetry) {
      return 0;
    }

    return Number((currentTelemetry[key] - previousTelemetry[key]).toFixed(2));
  }

  protected metricSeverity(assetId: string, metric: TelemetryMetricDefinition): TelemetrySeverity {
    const value = this.metricValue(assetId, metric.key);

    if (value >= metric.warningThreshold) {
      return 'warning';
    }

    return 'nominal';
  }

  protected meterPercent(assetId: string, metric: TelemetryMetricDefinition): number {
    const value = Math.max(0, this.metricValue(assetId, metric.key));
    return Math.min((value / metric.maxScale) * 100, 100);
  }

  protected telemetryStatus(assetId: string): string {
    return this.dataStore.telemetryByAssetId()[assetId]?.status ?? 'unknown';
  }
}
