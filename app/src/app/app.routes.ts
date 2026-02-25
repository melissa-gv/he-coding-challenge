import { Routes } from '@angular/router';
import { AssetListComponent } from './sub-components/asset-list/asset-list.component';
import { TelemetryDashboardComponent } from './sub-components/telemetry/telemetry-dashboard/telemetry-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'assets'
  },
  {
    path: 'assets',
    component: AssetListComponent
  },
  {
    path: 'telemetry',
    component: TelemetryDashboardComponent
  }
];
