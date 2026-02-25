import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AssetApiService } from '../api/asset-api.service';
import { Asset } from '../models/asset.models';

@Injectable({
  providedIn: 'root'
})
export class AssetStoreService {
  private readonly assetApi = inject(AssetApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _assets = signal<Asset[]>([]);
  readonly assets = this._assets.asReadonly();

  private readonly _isLoadingAssets = signal<boolean>(true);
  readonly isLoadingAssets = this._isLoadingAssets.asReadonly();

  private readonly _assetsError = signal<string | null>(null);
  readonly assetsError = this._assetsError.asReadonly();

  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.loadAssets();
  }

  loadAssets(): void {
    this._isLoadingAssets.set(true);
    this._assetsError.set(null);

    this.assetApi
      .getAssets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) => {
          this._assets.set(assets);
          this._isLoadingAssets.set(false);
        },
        error: () => {
          this._assetsError.set('Unable to load assets. Make sure the API is running on port 8000.');
          this._isLoadingAssets.set(false);
        }
      });
  }
}
