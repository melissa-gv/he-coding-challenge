import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AssetStoreService } from '../../../shared/store/asset-store.service';
import { TelemetryStoreService } from '../../../shared/store/telemetry-store.service';
import { TELEMETRY_METRICS, TelemetryMetric, TelemetryMetricKey, TelemetryMetricRow } from '../../../shared/models/telemetry-metric.models';
import { TelemetryAssetCardComponent } from '../telemetry-asset-card/telemetry-asset-card.component';
import { TelemetryAssetSelectorComponent } from '../telemetry-asset-selector/telemetry-asset-selector.component';

@Component({
  selector: 'app-telemetry-dashboard',
  imports: [CommonModule, ButtonModule, MessageModule, TelemetryAssetSelectorComponent, TelemetryAssetCardComponent],
  templateUrl: './telemetry-dashboard.component.html',
  styleUrl: './telemetry-dashboard.component.scss'
})
export class TelemetryDashboardComponent {
  private readonly assetStore = inject(AssetStoreService);
  private readonly telemetryStore = inject(TelemetryStoreService);

  protected readonly metrics: TelemetryMetric[] = TELEMETRY_METRICS;

  protected readonly assets = this.assetStore.assets;
  protected readonly selectedAssetIds = this.telemetryStore.selectedAssetIds;
  protected readonly selectedAssets = this.telemetryStore.selectedAssets;

  protected readonly isLoadingAssets = this.assetStore.isLoadingAssets;
  protected readonly isLoadingTelemetry = this.telemetryStore.isLoadingTelemetry;

  protected readonly assetsError = this.assetStore.assetsError;
  protected readonly telemetryError = this.telemetryStore.telemetryError;
  protected readonly lastLiveUpdate = this.telemetryStore.lastLiveUpdate;

  protected readonly hasTelemetryData = this.telemetryStore.hasTelemetryData;

  protected onSelectedAssetIdsChange(selectedIds: string[]): void {
    this.telemetryStore.setSelectedAssetIds(selectedIds);
  }

  protected refreshTelemetry(): void {
    this.telemetryStore.refreshTelemetry();
  }

  protected metricValue(assetId: string, key: TelemetryMetricKey): number {
    const telemetry = this.telemetryStore.telemetryByAssetId()[assetId];
    return telemetry?.[key] ?? 0;
  }

  protected telemetryStatus(assetId: string): string {
    return this.telemetryStore.telemetryByAssetId()[assetId]?.status ?? 'unknown';
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
