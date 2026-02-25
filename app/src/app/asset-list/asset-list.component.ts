import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  last_updated: string;
}

@Component({
  selector: 'app-asset-list',
  imports: [CommonModule],
  templateUrl: './asset-list.component.html',
  styleUrl: './asset-list.component.scss'
})
export class AssetListComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly assetsApiUrl = 'http://localhost:8000/api/assets';

  protected readonly assets = signal<Asset[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.loadAssets();
  }

  protected loadAssets(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http
      .get<Asset[]>(this.assetsApiUrl)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (assets) => {
          this.assets.set(assets);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load assets. Make sure the API is running on port 8000.');
          this.isLoading.set(false);
        }
      });
  }
}
