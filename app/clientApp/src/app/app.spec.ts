import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush([]);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  it('should render the asset list shell', () => {
    const fixture = TestBed.createComponent(App);
    const request = httpTestingController.expectOne('http://localhost:8000/api/assets');
    request.flush([]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Asset List');
  });
});
