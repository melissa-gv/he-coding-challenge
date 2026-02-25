import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { App } from './app';
import { TelemetryStoreService } from './shared/store/telemetry-store.service';

describe('App', () => {
  let httpTestingController: HttpTestingController;
  let telemetryStore: TelemetryStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    telemetryStore = TestBed.inject(TelemetryStoreService);
  });

  afterEach(() => {
    telemetryStore.stopPolling();
    httpTestingController.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush([]);

    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render both sections and use a shared assets request', async () => {
    const fixture = TestBed.createComponent(App);

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

    await fixture.whenStable();

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

    const powerRequest = httpTestingController.expectOne('http://localhost:8000/api/power/AST-001');
    powerRequest.flush({
      asset_id: 'AST-001',
      asset_name: 'Primary Cooling Pump',
      asset_type: 'pump',
      history: [{ timestamp: '2024-01-15T08:00:00Z', power_kw: 20.3, efficiency: 84.5 }],
      forecast: [{ timestamp: '2024-01-15T16:00:00Z', power_kw: 22.2, efficiency: 84.2 }],
      metadata: {}
    });

    fixture.detectChanges();

    httpTestingController.expectNone('http://localhost:8000/api/assets');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asset List');
    expect(compiled.textContent).toContain('Telemetry Display');
    expect(compiled.textContent).toContain('Power Consumption Visualization');
  });
});
