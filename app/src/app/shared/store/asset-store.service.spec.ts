import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AssetStoreService } from './asset-store.service';

describe('AssetStoreService', () => {
  let httpTestingController: HttpTestingController;
  let store: AssetStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AssetStoreService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('loads assets successfully', () => {
    store.initialize();

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

    expect(store.assets().length).toBe(1);
    expect(store.assetsError()).toBeNull();
    expect(store.isLoadingAssets()).toBe(false);
  });

  it('sets error state when asset loading fails', () => {
    store.initialize();

    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(store.assetsError()).toContain('Unable to load assets');
    expect(store.isLoadingAssets()).toBe(false);
  });
});
