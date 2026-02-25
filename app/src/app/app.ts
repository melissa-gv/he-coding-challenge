import { Component, inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { AssetListComponent } from './sub-components/asset-list/asset-list.component';
import { PowerVisualizationComponent } from './sub-components/power/power-visualization.component';
import { AssetStoreService } from './shared/store/asset-store.service';
import { TelemetryStoreService } from './shared/store/telemetry-store.service';
import { TelemetryDashboardComponent } from './sub-components/telemetry/telemetry-dashboard/telemetry-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [ToastModule, AssetListComponent, TelemetryDashboardComponent, PowerVisualizationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly assetStore = inject(AssetStoreService);
  private readonly telemetryStore = inject(TelemetryStoreService);

  constructor() {
    this.assetStore.initialize();
    this.telemetryStore.initialize();
  }
}
