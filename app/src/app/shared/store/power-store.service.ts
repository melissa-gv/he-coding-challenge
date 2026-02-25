import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PowerApiService } from '../api/power-api.service';
import { AssetStoreService } from './asset-store.service';
import { PowerHistoryResponse } from '../models/power-history.models';

@Injectable({
  providedIn: 'root'
})
export class PowerStoreService {
  private readonly powerApi = inject(PowerApiService);
  private readonly assetStore = inject(AssetStoreService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _selectedPowerAssetId = signal<string | null>(null);
  readonly selectedPowerAssetId = this._selectedPowerAssetId.asReadonly();

  private readonly _isLoadingPower = signal<boolean>(false);
  readonly isLoadingPower = this._isLoadingPower.asReadonly();

  private readonly _powerError = signal<string | null>(null);
  readonly powerError = this._powerError.asReadonly();

  private readonly _powerByAssetId = signal<Record<string, PowerHistoryResponse>>({});
  readonly powerByAssetId = this._powerByAssetId.asReadonly();

  readonly selectedPowerData = computed(() => {
    const powerAssetId = this._selectedPowerAssetId();

    if (!powerAssetId) {
      return null;
    }

    return this._powerByAssetId()[powerAssetId] ?? null;
  });

  constructor() {
    effect(() => {
      const assets = this.assetStore.assets();
      const currentSelection = this._selectedPowerAssetId();
      const currentIsValid = assets.some((asset) => asset.id === currentSelection);
      const nextSelection = currentIsValid ? currentSelection : assets[0]?.id ?? null;

      if (nextSelection !== currentSelection) {
        this._selectedPowerAssetId.set(nextSelection);
      }
    });
  }

  setSelectedPowerAssetId(assetId: string | null): void {
    if (!assetId) {
      this._selectedPowerAssetId.set(null);
      return;
    }

    const isValidAssetId = this.assetStore.assets().some((asset) => asset.id === assetId);

    if (!isValidAssetId || this._selectedPowerAssetId() === assetId) {
      return;
    }

    this._selectedPowerAssetId.set(assetId);
  }

  refreshPowerData(assetId: string | null): void {
    if (!assetId) {
      this._powerError.set(null);
      this._isLoadingPower.set(false);
      return;
    }

    this._isLoadingPower.set(true);
    this._powerError.set(null);

    this.powerApi
      .getPowerData(assetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (powerData) => {
          this._powerByAssetId.update((existing) => ({
            ...existing,
            [assetId]: powerData
          }));
          this._isLoadingPower.set(false);
        },
        error: () => {
          this._powerError.set('Unable to load power data. Make sure the API is running on port 8000.');
          this._isLoadingPower.set(false);
        }
      });
  }
}
