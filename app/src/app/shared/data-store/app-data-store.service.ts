import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, forkJoin, interval } from 'rxjs';
import { TelemetrySnapshot } from '../../telemetry/telemetry.models';
import { Asset } from '../models/asset.models';

const ASSETS_API_URL = 'http://localhost:8000/api/assets';
const TELEMETRY_API_URL = 'http://localhost:8000/api/telemetry';
const MAX_SELECTION = 3;
const POLL_INTERVAL_MS = 5000;

@Injectable({
  providedIn: 'root'
})
export class AppDataStoreService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _assets = signal<Asset[]>([]);
  readonly assets = this._assets.asReadonly();

  private readonly _selectedAssetIds = signal<string[]>([]);
  readonly selectedAssetIds = this._selectedAssetIds.asReadonly();

  private readonly _isLoadingAssets = signal<boolean>(true);
  readonly isLoadingAssets = this._isLoadingAssets.asReadonly();

  private readonly _assetsError = signal<string | null>(null);
  readonly assetsError = this._assetsError.asReadonly();

  private readonly _isLoadingTelemetry = signal<boolean>(false);
  readonly isLoadingTelemetry = this._isLoadingTelemetry.asReadonly();

  private readonly _telemetryError = signal<string | null>(null);
  readonly telemetryError = this._telemetryError.asReadonly();

  private readonly _lastLiveUpdate = signal<Date | null>(null);
  readonly lastLiveUpdate = this._lastLiveUpdate.asReadonly();

  private readonly _telemetryByAssetId = signal<Record<string, TelemetrySnapshot>>({});
  readonly telemetryByAssetId = this._telemetryByAssetId.asReadonly();

  readonly selectedAssets = computed(() => {
    const selectedIds = this._selectedAssetIds();
    const assets = this._assets();

    return selectedIds
      .map((selectedId) => assets.find((asset) => asset.id === selectedId))
      .filter((asset): asset is Asset => !!asset);
  });

  readonly hasTelemetryData = computed(() => Object.keys(this._telemetryByAssetId()).length > 0);

  private initialized = false;
  private pollingSubscription: Subscription | null = null;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.loadAssets();
    this.startPolling();
  }

  loadAssets(): void {
    this._isLoadingAssets.set(true);
    this._assetsError.set(null);

    this.http
      .get<Asset[]>(ASSETS_API_URL)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) => {
          this._assets.set(assets);
          this._isLoadingAssets.set(false);

          const validSelected = this.sanitizeSelection(this._selectedAssetIds(), assets);
          const nextSelection = validSelected.length
            ? validSelected
            : assets.slice(0, MAX_SELECTION).map((asset) => asset.id);

          const hasSelectionChanged = !this.sameSelection(nextSelection, this._selectedAssetIds());
          this._selectedAssetIds.set(nextSelection);

          if (hasSelectionChanged || (!this.hasTelemetryData() && !!nextSelection.length)) {
            this.refreshTelemetry();
          }
        },
        error: () => {
          this._assetsError.set('Unable to load assets. Make sure the API is running on port 8000.');
          this._isLoadingAssets.set(false);
        }
      });
  }

  setSelectedAssetIds(ids: string[]): void {
    const nextSelection = this.sanitizeSelection(ids, this._assets());

    if (this.sameSelection(nextSelection, this._selectedAssetIds())) {
      return;
    }

    this._selectedAssetIds.set(nextSelection);
    this.refreshTelemetry();
  }

  refreshTelemetry(): void {
    const selectedIds = this._selectedAssetIds();

    if (!selectedIds.length) {
      this._telemetryByAssetId.set({});
      this._telemetryError.set(null);
      this._isLoadingTelemetry.set(false);
      this._lastLiveUpdate.set(new Date());
      return;
    }

    this._isLoadingTelemetry.set(true);
    this._telemetryError.set(null);

    const requests = selectedIds.map((assetId) => this.http.get<TelemetrySnapshot>(`${TELEMETRY_API_URL}/${assetId}`));

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (telemetryRows) => {
          const nextTelemetry: Record<string, TelemetrySnapshot> = {};

          telemetryRows.forEach((telemetry) => {
            nextTelemetry[telemetry.asset_id] = telemetry;
          });

          this._telemetryByAssetId.set(nextTelemetry);
          this._lastLiveUpdate.set(new Date());
          this._isLoadingTelemetry.set(false);
        },
        error: () => {
          this._telemetryError.set('Unable to load telemetry. Make sure the API is running on port 8000.');
          this._isLoadingTelemetry.set(false);
        }
      });
  }

  startPolling(): void {
    if (this.pollingSubscription) {
      return;
    }

    this.pollingSubscription = interval(POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshTelemetry());
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  private sanitizeSelection(ids: string[], assets: Asset[]): string[] {
    const validAssetIds = new Set(assets.map((asset) => asset.id));
    const nextSelection: string[] = [];

    ids.forEach((id) => {
      if (!validAssetIds.has(id) || nextSelection.includes(id) || nextSelection.length >= MAX_SELECTION) {
        return;
      }

      nextSelection.push(id);
    });

    return nextSelection;
  }

  private sameSelection(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((id, index) => right[index] === id);
  }
}
