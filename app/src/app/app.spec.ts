import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AppDataStoreService } from './shared/data-store/app-data-store.service';

describe('App', () => {
  let httpTestingController: HttpTestingController;
  let dataStore: AppDataStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    dataStore = TestBed.inject(AppDataStoreService);
  });

  afterEach(() => {
    dataStore.stopPolling();
    httpTestingController.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush([]);

    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render both sections and use a shared assets request', () => {
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

    httpTestingController.expectNone('http://localhost:8000/api/assets');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asset List');
    expect(compiled.textContent).toContain('Telemetry Display');
  });
});
