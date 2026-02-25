import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppDataStoreService } from './app-data-store.service';

describe('AppDataStoreService', () => {
  let httpTestingController: HttpTestingController;
  let store: AppDataStoreService;

  const assetsFixture = [
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
    },
    {
      id: 'AST-003',
      name: 'Backup Generator',
      type: 'generator',
      location: 'Building C - Ground',
      status: 'standby',
      last_updated: '2024-01-15T10:26:00Z'
    },
    {
      id: 'AST-004',
      name: 'West Turbine',
      type: 'turbine',
      location: 'Building D - Roof',
      status: 'maintenance',
      last_updated: '2024-01-15T10:21:00Z'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AppDataStoreService);
  });

  afterEach(() => {
    store.stopPolling();
    httpTestingController.verify();
  });

  it('loads assets and defaults to first three selected assets', () => {
    store.initialize();

    const assetsRequest = httpTestingController.expectOne('http://localhost:8000/api/assets');
    assetsRequest.flush(assetsFixture);

    const telemetryRequestOne = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001');
    const telemetryRequestTwo = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002');
    const telemetryRequestThree = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003');

    telemetryRequestOne.flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 70,
      pressure: 110,
      vibration: 2,
      power_consumption: 20,
      status: 'operational'
    });

    telemetryRequestTwo.flush({
      asset_id: 'AST-002',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 80,
      pressure: 120,
      vibration: 3,
      power_consumption: 30,
      status: 'operational'
    });

    telemetryRequestThree.flush({
      asset_id: 'AST-003',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 60,
      pressure: 100,
      vibration: 1,
      power_consumption: 40,
      status: 'standby'
    });

    expect(store.assets().length).toBe(4);
    expect(store.selectedAssetIds()).toEqual(['AST-001', 'AST-002', 'AST-003']);
  });

  it('enforces selection limit to three assets', () => {
    store.initialize();

    const assetsRequest = httpTestingController.expectOne('http://localhost:8000/api/assets');
    assetsRequest.flush(assetsFixture);

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 70,
      pressure: 110,
      vibration: 2,
      power_consumption: 20,
      status: 'operational'
    });

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002').flush({
      asset_id: 'AST-002',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 80,
      pressure: 120,
      vibration: 3,
      power_consumption: 30,
      status: 'operational'
    });

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003').flush({
      asset_id: 'AST-003',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 60,
      pressure: 100,
      vibration: 1,
      power_consumption: 40,
      status: 'standby'
    });

    store.setSelectedAssetIds(['AST-004', 'AST-003', 'AST-002', 'AST-001']);

    const telemetryRequestOne = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-004');
    const telemetryRequestTwo = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003');
    const telemetryRequestThree = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002');

    telemetryRequestOne.flush({
      asset_id: 'AST-004',
      timestamp: '2024-01-15T10:31:00Z',
      temperature: 73,
      pressure: 113,
      vibration: 2.1,
      power_consumption: 25,
      status: 'maintenance'
    });

    telemetryRequestTwo.flush({
      asset_id: 'AST-003',
      timestamp: '2024-01-15T10:31:00Z',
      temperature: 63,
      pressure: 104,
      vibration: 1.2,
      power_consumption: 42,
      status: 'standby'
    });

    telemetryRequestThree.flush({
      asset_id: 'AST-002',
      timestamp: '2024-01-15T10:31:00Z',
      temperature: 82,
      pressure: 121,
      vibration: 3.2,
      power_consumption: 31,
      status: 'operational'
    });

    expect(store.selectedAssetIds()).toEqual(['AST-004', 'AST-003', 'AST-002']);
  });

  it('triggers periodic polling refreshes', () => {
    vi.useFakeTimers();
    try {
      store.initialize();

      const assetsRequest = httpTestingController.expectOne('http://localhost:8000/api/assets');
      assetsRequest.flush(assetsFixture);

      httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush({
        asset_id: 'AST-001',
        timestamp: '2024-01-15T10:30:00Z',
        temperature: 70,
        pressure: 110,
        vibration: 2,
        power_consumption: 20,
        status: 'operational'
      });

      httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002').flush({
        asset_id: 'AST-002',
        timestamp: '2024-01-15T10:30:00Z',
        temperature: 80,
        pressure: 120,
        vibration: 3,
        power_consumption: 30,
        status: 'operational'
      });

      httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003').flush({
        asset_id: 'AST-003',
        timestamp: '2024-01-15T10:30:00Z',
        temperature: 60,
        pressure: 100,
        vibration: 1,
        power_consumption: 40,
        status: 'standby'
      });

      vi.advanceTimersByTime(5000);

      httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush({
        asset_id: 'AST-001',
        timestamp: '2024-01-15T10:35:00Z',
        temperature: 71,
        pressure: 111,
        vibration: 2.2,
        power_consumption: 21,
        status: 'operational'
      });

      httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002').flush({
        asset_id: 'AST-002',
        timestamp: '2024-01-15T10:35:00Z',
        temperature: 81,
        pressure: 121,
        vibration: 3.1,
        power_consumption: 31,
        status: 'operational'
      });

      httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003').flush({
        asset_id: 'AST-003',
        timestamp: '2024-01-15T10:35:00Z',
        temperature: 61,
        pressure: 101,
        vibration: 1.1,
        power_consumption: 41,
        status: 'standby'
      });

      expect(store.lastLiveUpdate()).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('sets and clears error states for assets and telemetry', () => {
    store.initialize();

    const assetsRequest = httpTestingController.expectOne('http://localhost:8000/api/assets');
    assetsRequest.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(store.assetsError()).toContain('Unable to load assets');

    store.loadAssets();

    const retryAssetsRequest = httpTestingController.expectOne('http://localhost:8000/api/assets');
    retryAssetsRequest.flush(assetsFixture.slice(0, 1));

    const initialTelemetryRequest = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001');
    initialTelemetryRequest.flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 70,
      pressure: 110,
      vibration: 2,
      power_consumption: 20,
      status: 'operational'
    });

    expect(store.assetsError()).toBeNull();

    store.refreshTelemetry();

    const telemetryErrorRequest = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001');
    telemetryErrorRequest.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(store.telemetryError()).toContain('Unable to load telemetry');

    store.refreshTelemetry();

    const telemetryRetryRequest = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001');
    telemetryRetryRequest.flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:33:00Z',
      temperature: 72,
      pressure: 112,
      vibration: 2.4,
      power_consumption: 22,
      status: 'operational'
    });

    expect(store.telemetryError()).toBeNull();
  });

  it('loads power history and forecast for a given asset', () => {
    store.refreshPowerData('AST-003');

    const powerRequest = httpTestingController.expectOne('http://localhost:8000/api/power/AST-003');
    powerRequest.flush({
      asset_id: 'AST-003',
      asset_name: 'Backup Generator',
      asset_type: 'generator',
      history: [{ timestamp: '2024-01-15T08:00:00Z', power_kw: -96.4, efficiency: 32.1 }],
      forecast: [{ timestamp: '2024-01-15T16:00:00Z', power_kw: -101.2, efficiency: 30.4 }],
      metadata: {}
    });

    expect(store.powerError()).toBeNull();
    expect(store.powerByAssetId()['AST-003']?.history.length).toBe(1);
    expect(store.powerByAssetId()['AST-003']?.forecast.length).toBe(1);
  });
});
