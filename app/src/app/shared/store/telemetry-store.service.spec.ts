import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AssetStoreService } from './asset-store.service';
import { TelemetryStoreService } from './telemetry-store.service';

describe('TelemetryStoreService', () => {
  let httpTestingController: HttpTestingController;
  let assetStore: AssetStoreService;
  let telemetryStore: TelemetryStoreService;

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
    assetStore = TestBed.inject(AssetStoreService);
    telemetryStore = TestBed.inject(TelemetryStoreService);
  });

  afterEach(() => {
    telemetryStore.stopPolling();
    httpTestingController.verify();
  });

  it('loads telemetry and defaults selection to first three assets', async () => {
    assetStore.initialize();
    telemetryStore.initialize();

    httpTestingController.expectOne('http://localhost:8000/api/assets').flush(assetsFixture);
    TestBed.flushEffects();

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

    expect(telemetryStore.selectedAssetIds()).toEqual(['AST-001', 'AST-002', 'AST-003']);
    expect(Object.keys(telemetryStore.telemetryByAssetId()).length).toBe(3);
  });

  it('enforces max selection of three assets', async () => {
    assetStore.initialize();
    telemetryStore.initialize();

    httpTestingController.expectOne('http://localhost:8000/api/assets').flush(assetsFixture);
    TestBed.flushEffects();
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

    telemetryStore.setSelectedAssetIds(['AST-004', 'AST-003', 'AST-002', 'AST-001']);

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-004').flush({
      asset_id: 'AST-004',
      timestamp: '2024-01-15T10:31:00Z',
      temperature: 73,
      pressure: 113,
      vibration: 2.1,
      power_consumption: 25,
      status: 'maintenance'
    });

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003').flush({
      asset_id: 'AST-003',
      timestamp: '2024-01-15T10:31:00Z',
      temperature: 63,
      pressure: 104,
      vibration: 1.2,
      power_consumption: 42,
      status: 'standby'
    });

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002').flush({
      asset_id: 'AST-002',
      timestamp: '2024-01-15T10:31:00Z',
      temperature: 82,
      pressure: 121,
      vibration: 3.2,
      power_consumption: 31,
      status: 'operational'
    });

    expect(telemetryStore.selectedAssetIds()).toEqual(['AST-004', 'AST-003', 'AST-002']);
  });

  it('polls telemetry every 5 seconds', () => {
    vi.useFakeTimers();
    try {
      assetStore.initialize();
      telemetryStore.initialize();

      httpTestingController.expectOne('http://localhost:8000/api/assets').flush(assetsFixture);
      TestBed.flushEffects();
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

      expect(telemetryStore.lastLiveUpdate()).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('sets and clears telemetry errors', async () => {
    assetStore.initialize();
    telemetryStore.initialize();

    httpTestingController.expectOne('http://localhost:8000/api/assets').flush(assetsFixture.slice(0, 1));
    TestBed.flushEffects();
    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 70,
      pressure: 110,
      vibration: 2,
      power_consumption: 20,
      status: 'operational'
    });

    telemetryStore.refreshTelemetry();
    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush('boom', {
      status: 500,
      statusText: 'Server Error'
    });

    expect(telemetryStore.telemetryError()).toContain('Unable to load telemetry');

    telemetryStore.refreshTelemetry();
    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:33:00Z',
      temperature: 72,
      pressure: 112,
      vibration: 2.4,
      power_consumption: 22,
      status: 'operational'
    });

    expect(telemetryStore.telemetryError()).toBeNull();
  });
});
