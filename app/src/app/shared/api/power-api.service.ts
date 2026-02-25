import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PowerHistoryResponse } from '../models/power-history.models';

const POWER_API_URL = 'http://localhost:8000/api/power';

@Injectable({
  providedIn: 'root'
})
export class PowerApiService {
  private readonly http = inject(HttpClient);

  getPowerData(assetId: string): Observable<PowerHistoryResponse> {
    return this.http.get<PowerHistoryResponse>(`${POWER_API_URL}/${assetId}`);
  }
}
