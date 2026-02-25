import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { Asset } from '../../../shared/models/asset.models';

@Component({
  selector: 'app-telemetry-asset-selector',
  imports: [CommonModule, FormsModule, MultiSelectModule],
  templateUrl: './telemetry-asset-selector.component.html',
  styleUrl: './telemetry-asset-selector.component.scss'
})
export class TelemetryAssetSelectorComponent {
  readonly assets = input.required<Asset[]>();
  readonly selectedAssetIds = input.required<string[]>();
  readonly maxSelection = input<number>(3);

  readonly selectedAssetIdsChange = output<string[]>();

  protected onSelectionChange(nextSelection: string[] | null): void {
    this.selectedAssetIdsChange.emit(nextSelection ?? []);
  }
}
