import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppDataStoreService } from '../shared/data-store/app-data-store.service';
import { AssetListComponent } from './asset-list.component';

describe('AssetListComponent', () => {
  let httpTestingController: HttpTestingController;
  let dataStore: AppDataStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    dataStore = TestBed.inject(AppDataStoreService);
  });

  afterEach(() => {
    dataStore.stopPolling();
    httpTestingController.verify();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(AssetListComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should load and render key asset fields from shared store actions', () => {
    const fixture = TestBed.createComponent(AssetListComponent);
    const component = fixture.componentInstance as unknown as { loadAssets: () => void };

    component.loadAssets();

    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush([
      {
        id: 'AST-001',
        name: 'Primary Cooling Pump',
        type: 'pump',
        location: 'Building A - Floor 1',
        status: 'operational',
        last_updated: '2024-01-15T10:30:00Z'
      }
    ]);

    const telemetryRequest = httpTestingController.expectOne('http://localhost:8000/api/telemetry/AST-001');
    telemetryRequest.flush({
      asset_id: 'AST-001',
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 71.4,
      pressure: 118.2,
      vibration: 2.5,
      power_consumption: 18.9,
      status: 'operational'
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent ?? '';

    expect(compiled.querySelector('.asset-table')).toBeTruthy();
    expect(compiled.querySelectorAll('.asset-table th').length).toBe(4);
    expect(content).toContain('Primary Cooling Pump');
    expect(content.toLowerCase()).toContain('pump');
    expect(content).toContain('Building A - Floor 1');
    expect(content.toLowerCase()).toContain('operational');
  });
});
