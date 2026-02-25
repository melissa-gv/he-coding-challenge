import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetConfiguration } from '../models/asset-configuration.models';

const CONFIGURATION_API_URL = 'http://localhost:8000/api/configuration';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationApiService {
  private readonly http = inject(HttpClient);

  getConfiguration(assetId: string): Observable<AssetConfiguration> {
    return this.http.get<AssetConfiguration>(`${CONFIGURATION_API_URL}/${assetId}`);
  }

  saveConfiguration(configuration: AssetConfiguration): Observable<AssetConfiguration> {
    return this.http.post<AssetConfiguration>(CONFIGURATION_API_URL, configuration);
  }
}
