import { Component, inject } from '@angular/core';
import { AssetListComponent } from './asset-list/asset-list.component';
import { PowerVisualizationComponent } from './power/power-visualization.component';
import { AppDataStoreService } from './shared/data-store/app-data-store.service';
import { TelemetryDashboardComponent } from './telemetry/telemetry-dashboard/telemetry-dashboard.component';

@Component({
  selector: 'app-root',
  imports: [AssetListComponent, TelemetryDashboardComponent, PowerVisualizationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly dataStore = inject(AppDataStoreService);

  constructor() {
    this.dataStore.initialize();
  }
}
