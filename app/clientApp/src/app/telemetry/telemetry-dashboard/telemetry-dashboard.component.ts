import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, interval } from 'rxjs';
import { TelemetryAssetSelectorComponent } from '../telemetry-asset-selector/telemetry-asset-selector.component';
import { TelemetryMetricCardComponent } from '../telemetry-metric-card/telemetry-metric-card.component';
import {
  TELEMETRY_METRICS,
  TelemetryAsset,
  TelemetryMetricDefinition,
  TelemetryMetricKey,
  TelemetrySeverity,
  TelemetrySnapshot
} from '../telemetry.models';

@Component({
  selector: 'app-telemetry-dashboard',
  imports: [CommonModule, TelemetryAssetSelectorComponent, TelemetryMetricCardComponent],
  templateUrl: './telemetry-dashboard.component.html',
  styleUrl: './telemetry-dashboard.component.scss'
})
export class TelemetryDashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly assetsApiUrl = 'http://localhost:8000/api/assets';
  private readonly telemetryApiUrl = 'http://localhost:8000/api/telemetry';

  protected readonly metrics: TelemetryMetricDefinition[] = TELEMETRY_METRICS;

  protected readonly assets = signal<TelemetryAsset[]>([]);
  protected readonly selectedAssetIds = signal<string[]>([]);

  protected readonly isLoadingAssets = signal<boolean>(true);
  protected readonly isLoadingTelemetry = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly lastLiveUpdate = signal<Date | null>(null);

  private readonly telemetryByAssetId = signal<Record<string, TelemetrySnapshot>>({});
  private readonly previousTelemetryByAssetId = signal<Record<string, TelemetrySnapshot>>({});

  protected readonly selectedAssets = computed(() => {
    const selectedIds = this.selectedAssetIds();
    const assets = this.assets();

    return selectedIds
      .map((selectedId) => assets.find((asset) => asset.id === selectedId))
      .filter((asset): asset is TelemetryAsset => !!asset);
  });

  protected readonly hasTelemetryData = computed(() => Object.keys(this.telemetryByAssetId()).length > 0);

  constructor() {
    this.loadAssets();

    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshTelemetry());
  }

  protected onSelectedAssetIdsChange(selectedIds: string[]): void {
    this.selectedAssetIds.set(selectedIds);
    this.refreshTelemetry();
  }

  protected refreshTelemetry(): void {
    const selectedIds = this.selectedAssetIds();

    if (!selectedIds.length) {
      this.telemetryByAssetId.set({});
      this.lastLiveUpdate.set(new Date());
      return;
    }

    this.isLoadingTelemetry.set(true);
    this.errorMessage.set(null);

    const requests = selectedIds.map((assetId) => this.http.get<TelemetrySnapshot>(`${this.telemetryApiUrl}/${assetId}`));

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (telemetryRows) => {
          const nextTelemetry: Record<string, TelemetrySnapshot> = {};

          telemetryRows.forEach((telemetry) => {
            nextTelemetry[telemetry.asset_id] = telemetry;
          });

          this.previousTelemetryByAssetId.set(this.telemetryByAssetId());
          this.telemetryByAssetId.set(nextTelemetry);
          this.lastLiveUpdate.set(new Date());
          this.isLoadingTelemetry.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load telemetry. Make sure the API is running on port 8000.');
          this.isLoadingTelemetry.set(false);
        }
      });
  }

  protected metricValue(assetId: string, key: TelemetryMetricKey): number {
    const telemetry = this.telemetryByAssetId()[assetId];
    return telemetry?.[key] ?? 0;
  }

  protected metricDelta(assetId: string, key: TelemetryMetricKey): number {
    const previousTelemetry = this.previousTelemetryByAssetId()[assetId];
    const currentTelemetry = this.telemetryByAssetId()[assetId];

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
    return this.telemetryByAssetId()[assetId]?.status ?? 'unknown';
  }

  private loadAssets(): void {
    this.isLoadingAssets.set(true);
    this.errorMessage.set(null);

    this.http
      .get<TelemetryAsset[]>(this.assetsApiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) => {
          this.assets.set(assets);

          const defaultSelection = assets.slice(0, 2).map((asset) => asset.id);
          this.selectedAssetIds.set(defaultSelection);

          this.isLoadingAssets.set(false);
          this.refreshTelemetry();
        },
        error: () => {
          this.errorMessage.set('Unable to load assets for telemetry. Make sure the API is running on port 8000.');
          this.isLoadingAssets.set(false);
        }
      });
  }
}
