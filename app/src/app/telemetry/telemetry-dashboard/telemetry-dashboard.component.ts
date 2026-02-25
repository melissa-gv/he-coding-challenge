import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AppDataStoreService } from '../../shared/data-store/app-data-store.service';
import { TelemetryAssetCardComponent } from '../telemetry-asset-card/telemetry-asset-card.component';
import { TelemetryAssetSelectorComponent } from '../telemetry-asset-selector/telemetry-asset-selector.component';
import { TELEMETRY_METRICS, TelemetryMetric, TelemetryMetricKey, TelemetryMetricRow } from '../telemetry.models';

@Component({
  selector: 'app-telemetry-dashboard',
  imports: [CommonModule, ButtonModule, MessageModule, TelemetryAssetSelectorComponent, TelemetryAssetCardComponent],
  templateUrl: './telemetry-dashboard.component.html',
  styleUrl: './telemetry-dashboard.component.scss'
})
export class TelemetryDashboardComponent {
  private readonly dataStore = inject(AppDataStoreService);

  protected readonly metrics: TelemetryMetric[] = TELEMETRY_METRICS;

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

  protected telemetryStatus(assetId: string): string {
    return this.dataStore.telemetryByAssetId()[assetId]?.status ?? 'unknown';
  }

  protected assetMetricRows(assetId: string): TelemetryMetricRow[] {
    return this.metrics.map((metric) => ({
      key: metric.key,
      label: metric.label,
      unit: metric.unit,
      value: this.metricValue(assetId, metric.key)
    }));
  }
}
