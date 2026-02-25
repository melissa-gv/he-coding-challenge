import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { TelemetrySnapshot } from '../models/telemetry-snapshot.models';

const TELEMETRY_API_URL = 'http://localhost:8000/api/telemetry';

@Injectable({
  providedIn: 'root'
})
export class TelemetryApiService {
  private readonly http = inject(HttpClient);

  getTelemetry(assetId: string): Observable<TelemetrySnapshot> {
    return this.http.get<TelemetrySnapshot>(`${TELEMETRY_API_URL}/${assetId}`);
  }
}
