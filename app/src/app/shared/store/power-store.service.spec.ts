import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AssetStoreService } from './asset-store.service';
import { PowerStoreService } from './power-store.service';

describe('PowerStoreService', () => {
  let httpTestingController: HttpTestingController;
  let assetStore: AssetStoreService;
  let powerStore: PowerStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    assetStore = TestBed.inject(AssetStoreService);
    powerStore = TestBed.inject(PowerStoreService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('defaults selected power asset from loaded assets', async () => {
    assetStore.initialize();

    httpTestingController.expectOne('http://localhost:8000/api/assets').flush([
      {
        id: 'AST-001',
        name: 'Primary Cooling Pump',
        type: 'pump',
        location: 'Building A - Floor 1',
        status: 'operational',
        last_updated: '2024-01-15T10:30:00Z'
      },
      {
        id: 'AST-002',
        name: 'Air Compressor Unit 1',
        type: 'compressor',
        location: 'Building B - Floor 2',
        status: 'operational',
        last_updated: '2024-01-15T10:28:00Z'
      }
    ]);

    TestBed.flushEffects();
    expect(powerStore.selectedPowerAssetId()).toBe('AST-001');
  });

  it('loads power history and forecast for selected asset', () => {
    assetStore.initialize();

    httpTestingController.expectOne('http://localhost:8000/api/assets').flush([
      {
        id: 'AST-003',
        name: 'Backup Generator',
        type: 'generator',
        location: 'Building C - Ground',
        status: 'standby',
        last_updated: '2024-01-15T10:26:00Z'
      }
    ]);

    powerStore.refreshPowerData('AST-003');

    const powerRequest = httpTestingController.expectOne('http://localhost:8000/api/power/AST-003');
    powerRequest.flush({
      asset_id: 'AST-003',
      asset_name: 'Backup Generator',
      asset_type: 'generator',
      history: [{ timestamp: '2024-01-15T08:00:00Z', power_kw: -96.4, efficiency: 32.1 }],
      forecast: [{ timestamp: '2024-01-15T16:00:00Z', power_kw: -101.2, efficiency: 30.4 }],
      metadata: {}
    });

    expect(powerStore.powerError()).toBeNull();
    expect(powerStore.powerByAssetId()['AST-003']?.history.length).toBe(1);
    expect(powerStore.powerByAssetId()['AST-003']?.forecast.length).toBe(1);
  });
});
