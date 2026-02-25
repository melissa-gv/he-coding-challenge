import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AssetStoreService } from '../../shared/store/asset-store.service';
import { PowerVisualizationComponent } from './power-visualization.component';

describe('PowerVisualizationComponent', () => {
  let httpTestingController: HttpTestingController;
  let assetStore: AssetStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerVisualizationComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    assetStore = TestBed.inject(AssetStoreService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('renders a power section with asset select and chart', () => {
    const fixture = TestBed.createComponent(PowerVisualizationComponent);

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
