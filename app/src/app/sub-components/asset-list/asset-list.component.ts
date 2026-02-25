import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AssetConfigurationDialogComponent } from './asset-configuration-dialog/asset-configuration-dialog.component';
import { Asset } from '../../shared/models/asset.models';
import { AssetStoreService } from '../../shared/store/asset-store.service';

@Component({
  selector: 'app-asset-list',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
    AssetConfigurationDialogComponent
  ],
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
  protected readonly nameFilterValue = signal<string>('');
  protected readonly typeFilterValue = signal<string | null>(null);
  protected readonly locationFilterValue = signal<string>('');
  protected readonly statusFilterValue = signal<string | null>(null);
  protected readonly typeFilterOptions = computed(() =>
    [...new Set(this.assets().map((asset) => asset.type))]
      .sort((first, second) => first.localeCompare(second))
      .map((type) => ({ label: this.toLabel(type), value: type }))
  );
  protected readonly statusFilterOptions = computed(() =>
    [...new Set(this.assets().map((asset) => asset.status))]
      .sort((first, second) => first.localeCompare(second))
      .map((status) => ({ label: this.toLabel(status), value: status }))
  );

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

  protected onTextFilter(event: Event, table: Table, field: 'name' | 'location'): void {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'name') {
      this.nameFilterValue.set(value);
    } else {
      this.locationFilterValue.set(value);
    }

    table.filter(value, field, 'contains');
  }

  protected onSelectFilter(table: Table, field: 'type' | 'status', value: string | null): void {
    if (field === 'type') {
      this.typeFilterValue.set(value);
    } else {
      this.statusFilterValue.set(value);
    }

    table.filter(value, field, 'equals');
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

  private toLabel(value: string): string {
    return value
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
