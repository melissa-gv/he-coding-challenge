import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PowerHistoryResponse } from '../models/power-history.models';
import { API_PREFIX } from './api-base-url';

const POWER_API_URL = `${API_PREFIX}/power`;

@Injectable({
  providedIn: 'root'
})
export class PowerApiService {
  private readonly http = inject(HttpClient);

  getPowerData(assetId: string): Observable<PowerHistoryResponse> {
    return this.http.get<PowerHistoryResponse>(`${POWER_API_URL}/${assetId}`);
  }
}
