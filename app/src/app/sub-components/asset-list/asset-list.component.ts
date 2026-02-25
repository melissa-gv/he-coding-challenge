import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AssetConfigurationDialogComponent } from './asset-configuration-dialog/asset-configuration-dialog.component';
import { Asset } from '../../shared/models/asset.models';
import { AssetStoreService } from '../../shared/store/asset-store.service';

@Component({
  selector: 'app-asset-list',
  imports: [CommonModule, ButtonModule, MessageModule, TableModule, TagModule, AssetConfigurationDialogComponent],
  templateUrl: './asset-list.component.html',
  styleUrl: './asset-list.component.scss'
})
export class AssetListComponent {
  private readonly assetStore = inject(AssetStoreService);

  protected readonly assets = this.assetStore.assets;
  protected readonly isLoading = this.assetStore.isLoadingAssets;
  protected readonly errorMessage = this.assetStore.assetsError;
  protected readonly isConfigurationDialogVisible = signal<boolean>(false);
  protected readonly selectedConfigurationAsset = signal<Asset | null>(null);

  protected loadAssets(): void {
    this.assetStore.loadAssets();
  }

  protected openConfigurationDialog(asset: Asset): void {
    this.selectedConfigurationAsset.set(asset);
    this.isConfigurationDialogVisible.set(true);
  }

  protected onConfigurationDialogVisibleChange(visible: boolean): void {
    this.isConfigurationDialogVisible.set(visible);

    if (!visible) {
      this.selectedConfigurationAsset.set(null);
    }
  }

  protected statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
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
