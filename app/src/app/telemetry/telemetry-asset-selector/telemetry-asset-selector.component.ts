import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TelemetryAsset } from '../telemetry.models';

@Component({
  selector: 'app-telemetry-asset-selector',
  imports: [CommonModule],
  templateUrl: './telemetry-asset-selector.component.html',
  styleUrl: './telemetry-asset-selector.component.scss'
})
export class TelemetryAssetSelectorComponent {
  readonly assets = input.required<TelemetryAsset[]>();
  readonly selectedAssetIds = input.required<string[]>();
  readonly maxSelection = input<number>(3);

  readonly selectedAssetIdsChange = output<string[]>();

  protected toggleAsset(assetId: string): void {
    const currentSelection = this.selectedAssetIds();

    if (currentSelection.includes(assetId)) {
      this.selectedAssetIdsChange.emit(currentSelection.filter((id) => id !== assetId));
      return;
    }

    if (currentSelection.length >= this.maxSelection()) {
      return;
    }

    this.selectedAssetIdsChange.emit([...currentSelection, assetId]);
  }

  protected isSelected(assetId: string): boolean {
    return this.selectedAssetIds().includes(assetId);
  }

  protected isDisabled(assetId: string): boolean {
    return !this.isSelected(assetId) && this.selectedAssetIds().length >= this.maxSelection();
  }
}
