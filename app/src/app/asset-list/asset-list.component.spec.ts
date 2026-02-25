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
    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush([]);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should render key asset fields', () => {
    const fixture = TestBed.createComponent(AssetListComponent);
    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');

    request.flush([
      {
        id: 'AST-001',
        name: 'Primary Cooling Pump',
        type: 'pump',
        location: 'Building A - Floor 1',
        status: 'operational'
      }
    ]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent ?? '';
    expect(compiled.querySelector('table.asset-table')).toBeTruthy();
    expect(compiled.querySelectorAll('table.asset-table thead th').length).toBe(4);
    expect(content).toContain('Primary Cooling Pump');
    expect(content.toLowerCase()).toContain('pump');
    expect(content).toContain('Building A - Floor 1');
    expect(content.toLowerCase()).toContain('operational');
  });
});
