import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AssetConfigurationDialogComponent } from './asset-configuration-dialog.component';

describe('AssetConfigurationDialogComponent', () => {
  let httpTestingController: HttpTestingController;

  const assetFixture = {
    id: 'AST-001',
    name: 'Primary Cooling Pump',
    type: 'pump',
    location: 'Building A - Floor 1',
    status: 'operational',
    last_updated: '2024-01-15T10:30:00Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetConfigurationDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('loads an existing configuration when opening for an asset', () => {
    const fixture = TestBed.createComponent(AssetConfigurationDialogComponent);
    const component = fixture.componentInstance as unknown as { form: { controls: { name: { value: string } } } };

    fixture.componentRef.setInput('asset', assetFixture);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.flushEffects();

    const getRequest = httpTestingController.expectOne('http://localhost:8000/api/configuration/AST-001');
    getRequest.flush({
      asset_id: 'AST-001',
      name: 'Configured Cooling Pump',
      priority: 'high',
      maintenance_mode: 'predictive',
      operating_mode: 'continuous',
      maintenance_interval_days: 20,
      max_runtime_hours: 80000,
      warning_threshold_percent: 90,
      max_temperature_celsius: 95,
      max_pressure_psi: 250,
      efficiency_target_percent: 88,
      power_factor: 0.97,
      load_capacity_percent: 105,
      alert_email: 'ops@example.com',
      location: 'Building A - Floor 1',
      notes: 'Configured from API'
    });

    fixture.detectChanges();

    expect(component.form.controls.name.value).toBe('Configured Cooling Pump');
  });

  it('applies client-side validation for power factor not equal to zero', () => {
    const fixture = TestBed.createComponent(AssetConfigurationDialogComponent);
    const component = fixture.componentInstance as unknown as {
      form: { controls: { power_factor: { setValue: (value: number) => void; errors: Record<string, unknown> | null } } };
      submitConfiguration: () => void;
    };

    fixture.componentRef.setInput('asset', assetFixture);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.flushEffects();

    httpTestingController.expectOne('http://localhost:8000/api/configuration/AST-001').flush('missing', {
      status: 404,
      statusText: 'Not Found'
    });

    component.form.controls.power_factor.setValue(0);
    component.submitConfiguration();

    httpTestingController.expectNone('http://localhost:8000/api/configuration');
    expect(component.form.controls.power_factor.errors?.['notZero']).toBe(true);
  });

  it('maps server validation errors to form controls on submit', () => {
    const fixture = TestBed.createComponent(AssetConfigurationDialogComponent);
    const component = fixture.componentInstance as unknown as {
      form: { patchValue: (value: object) => void; controls: { max_pressure_psi: { errors: Record<string, unknown> | null } } };
      submitConfiguration: () => void;
      visibleChange: { subscribe: (listener: (nextVisible: boolean) => void) => { unsubscribe: () => void } };
    };
    const emittedVisibilityChanges: boolean[] = [];
    const visibilitySubscription = component.visibleChange.subscribe((nextVisible) =>
      emittedVisibilityChanges.push(nextVisible)
    );

    fixture.componentRef.setInput('asset', assetFixture);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.flushEffects();

    httpTestingController.expectOne('http://localhost:8000/api/configuration/AST-001').flush('missing', {
      status: 404,
      statusText: 'Not Found'
    });

    component.form.patchValue({
      alert_email: 'ops@example.com',
      max_pressure_psi: 220
    });

    component.submitConfiguration();

    const saveRequest = httpTestingController.expectOne('http://localhost:8000/api/configuration');
    saveRequest.flush(
      {
        detail: [
          {
            loc: ['body', 'max_pressure_psi'],
            msg: 'Input should be greater than or equal to 0'
          }
        ]
      },
      { status: 422, statusText: 'Unprocessable Entity' }
    );

    fixture.detectChanges();

    expect(component.form.controls.max_pressure_psi.errors?.['server']).toBe(
      'Input should be greater than or equal to 0'
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Please review the highlighted fields');
    expect(emittedVisibilityChanges).toEqual([]);
    visibilitySubscription.unsubscribe();
  });

  it('closes the dialog and shows a success toast when save succeeds', () => {
    const fixture = TestBed.createComponent(AssetConfigurationDialogComponent);
    const component = fixture.componentInstance as unknown as {
      form: { patchValue: (value: object) => void };
      submitConfiguration: () => void;
      visibleChange: { subscribe: (listener: (nextVisible: boolean) => void) => { unsubscribe: () => void } };
    };
    const messageService = TestBed.inject(MessageService);
    const emittedVisibilityChanges: boolean[] = [];
    const emittedMessages: Array<{ severity?: string; summary?: string }> = [];
    const visibilitySubscription = component.visibleChange.subscribe((nextVisible) =>
      emittedVisibilityChanges.push(nextVisible)
    );
    const messageSubscription = messageService.messageObserver.subscribe((message) => {
      if (Array.isArray(message)) {
        message.forEach((entry) => emittedMessages.push(entry));
        return;
      }

      emittedMessages.push(message);
    });

    fixture.componentRef.setInput('asset', assetFixture);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.flushEffects();

    httpTestingController.expectOne('http://localhost:8000/api/configuration/AST-001').flush('missing', {
      status: 404,
      statusText: 'Not Found'
    });

    component.form.patchValue({
      alert_email: 'ops@example.com'
    });

    component.submitConfiguration();

    const saveRequest = httpTestingController.expectOne('http://localhost:8000/api/configuration');
    saveRequest.flush({
      asset_id: 'AST-001',
      name: 'Primary Cooling Pump',
      priority: 'medium',
      maintenance_mode: 'scheduled',
      operating_mode: 'continuous',
      maintenance_interval_days: 30,
      max_runtime_hours: 50000,
      warning_threshold_percent: 85,
      max_temperature_celsius: 90,
      max_pressure_psi: 200,
      efficiency_target_percent: 85,
      power_factor: 0.95,
      load_capacity_percent: 100,
      alert_email: 'ops@example.com',
      location: 'Building A - Floor 1',
      notes: null
    });

    expect(emittedVisibilityChanges).toContain(false);
    expect(
      emittedMessages.some((message) => message.severity === 'success' && message.summary === 'Configuration Saved')
    ).toBe(true);
    visibilitySubscription.unsubscribe();
    messageSubscription.unsubscribe();
  });
});
