import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AssetListComponent } from './asset-list.component';

describe('AssetListComponent', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
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

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent ?? '';

    expect(compiled.querySelector('.asset-table')).toBeTruthy();
    expect(compiled.querySelector('#asset-name-filter')).toBeTruthy();
    expect(compiled.querySelector('#asset-location-filter')).toBeTruthy();
    expect(compiled.querySelectorAll('.asset-filter-row p-select').length).toBe(2);
    expect(compiled.querySelectorAll('.asset-table .asset-filter-row th').length).toBe(5);
    expect(compiled.querySelectorAll('.asset-table th p-sorticon').length).toBe(4);
    expect(compiled.querySelector('.asset-config-button .pi-cog')).toBeTruthy();
    expect(content).toContain('Primary Cooling Pump');
    expect(content.toLowerCase()).toContain('pump');
    expect(content).toContain('Building A - Floor 1');
    expect(content.toLowerCase()).toContain('operational');
  });
});
