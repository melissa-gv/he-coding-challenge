import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Asset } from '../models/asset.models';
import { API_PREFIX } from './api-base-url';

const ASSETS_API_URL = `${API_PREFIX}/assets`;

@Injectable({
  providedIn: 'root'
})
export class AssetApiService {
  private readonly http = inject(HttpClient);

  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(ASSETS_API_URL);
  }
}
