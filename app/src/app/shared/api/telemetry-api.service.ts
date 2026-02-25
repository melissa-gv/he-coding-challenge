import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TelemetrySnapshot } from '../models/telemetry-snapshot.models';
import { API_PREFIX } from './api-base-url';

const TELEMETRY_API_URL = `${API_PREFIX}/telemetry`;

@Injectable({
  providedIn: 'root'
})
export class TelemetryApiService {
  private readonly http = inject(HttpClient);

  getTelemetry(assetId: string): Observable<TelemetrySnapshot> {
    return this.http.get<TelemetrySnapshot>(`${TELEMETRY_API_URL}/${assetId}`);
  }
}
