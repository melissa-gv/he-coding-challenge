import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppDataStoreService } from '../../shared/data-store/app-data-store.service';
import { TelemetryDashboardComponent } from './telemetry-dashboard.component';

describe('TelemetryDashboardComponent', () => {
  let httpTestingController: HttpTestingController;
  let dataStore: AppDataStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    dataStore = TestBed.inject(AppDataStoreService);
  });

  afterEach(() => {
    dataStore.stopPolling();
    httpTestingController.verify();
  });

  it('should render telemetry metrics using latest shared store data', () => {
    const fixture = TestBed.createComponent(TelemetryDashboardComponent);

    dataStore.initialize();

    const assetsRequest = httpTestingController.expectOne('http://localhost:8000/api/assets');
    assetsRequest.flush([
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
      }
    ]);

    const telemetryRequestOne = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001');
    const telemetryRequestTwo = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002');
    const telemetryRequestThree = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003');

    telemetryRequestOne.flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 71.4,
      pressure: 118.2,
      vibration: 2.5,
      power_consumption: 18.9,
      status: 'operational'
    });

    telemetryRequestTwo.flush({
      asset_id: 'AST-002',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 93.2,
      pressure: 151.7,
      vibration: 5.1,
      power_consumption: 54.1,
      status: 'operational'
    });

    telemetryRequestThree.flush({
      asset_id: 'AST-003',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 64.2,
      pressure: 114.3,
      vibration: 1.8,
      power_consumption: 40.7,
      status: 'standby'
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(dataStore.selectedAssetIds().length).toBe(3);
    expect(compiled.textContent).toContain('Telemetry Display');
    expect(compiled.textContent).toContain('Temperature');
    expect(compiled.textContent).toContain('Pressure');
    expect(compiled.textContent).toContain('Primary Cooling Pump');
    expect(compiled.textContent).toContain('Air Compressor Unit 1');
    expect(compiled.textContent).toContain('Backup Generator');
    expect(compiled.textContent).toContain('71.4');
    expect(compiled.querySelectorAll('app-telemetry-metric-card').length).toBe(12);
    expect(compiled.textContent).not.toContain('since last poll');
    expect(compiled.querySelector('p-progressbar')).toBeNull();
  });
});
