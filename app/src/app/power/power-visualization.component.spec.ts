import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppDataStoreService } from '../shared/data-store/app-data-store.service';
import { PowerVisualizationComponent } from './power-visualization.component';

describe('PowerVisualizationComponent', () => {
  let httpTestingController: HttpTestingController;
  let dataStore: AppDataStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerVisualizationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    dataStore = TestBed.inject(AppDataStoreService);
  });

  afterEach(() => {
    dataStore.stopPolling();
    httpTestingController.verify();
  });

  it('renders a power section with asset select and chart', () => {
    const fixture = TestBed.createComponent(PowerVisualizationComponent);

    dataStore.initialize();

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

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001').flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 71.4,
      pressure: 118.2,
      vibration: 2.5,
      power_consumption: 18.9,
      status: 'operational'
    });

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-002').flush({
      asset_id: 'AST-002',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 93.2,
      pressure: 151.7,
      vibration: 5.1,
      power_consumption: 54.1,
      status: 'operational'
    });

    httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-003').flush({
      asset_id: 'AST-003',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 64.2,
      pressure: 114.3,
      vibration: 1.8,
      power_consumption: 40.7,
      status: 'standby'
    });

    fixture.detectChanges();

    httpTestingController.expectOne('http://localhost:8000/api/power/AST-001').flush({
      asset_id: 'AST-001',
      asset_name: 'Primary Cooling Pump',
      asset_type: 'pump',
      history: [{ timestamp: '2024-01-15T08:00:00Z', power_kw: 20.3, efficiency: 84.5 }],
      forecast: [{ timestamp: '2024-01-15T16:00:00Z', power_kw: 22.2, efficiency: 84.2 }],
      metadata: {}
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Power Consumption Visualization');
    expect(compiled.querySelector('p-select')).toBeTruthy();
    expect(compiled.querySelector('p-chart canvas')).toBeTruthy();
  });
});
