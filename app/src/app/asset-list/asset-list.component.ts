import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AppDataStoreService } from '../shared/data-store/app-data-store.service';

@Component({
  selector: 'app-asset-list',
  imports: [CommonModule, ButtonModule, MessageModule, TableModule, TagModule],
  templateUrl: './asset-list.component.html',
  styleUrl: './asset-list.component.scss'
})
export class AssetListComponent {
  private readonly dataStore = inject(AppDataStoreService);

  protected readonly assets = this.dataStore.assets;
  protected readonly isLoading = this.dataStore.isLoadingAssets;
  protected readonly errorMessage = this.dataStore.assetsError;

  protected loadAssets(): void {
    this.dataStore.loadAssets();
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
