import { TestBed } from '@angular/core/testing';
import { TelemetryMetricCardComponent } from './telemetry-metric-card.component';

describe('TelemetryMetricCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryMetricCardComponent]
    }).compileComponents();
  });

  it('renders latest value, unit, and status', () => {
    const fixture = TestBed.createComponent(TelemetryMetricCardComponent);

    fixture.componentRef.setInput('assetName', 'Primary Cooling Pump');
    fixture.componentRef.setInput('assetType', 'pump');
    fixture.componentRef.setInput('status', 'operational');
    fixture.componentRef.setInput('metricLabel', 'Temperature');
    fixture.componentRef.setInput('unit', 'C');
    fixture.componentRef.setInput('value', 71.4);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent ?? '';

    expect(content).toContain('Primary Cooling Pump');
    expect(content).toContain('Temperature');
    expect(content).toContain('71.4');
    expect(content).toContain('C');
    expect(content).toContain('Operational');
  });

  it('maps status values to expected p-tag severity classes', () => {
    const fixture = TestBed.createComponent(TelemetryMetricCardComponent);

    fixture.componentRef.setInput('assetName', 'Primary Cooling Pump');
    fixture.componentRef.setInput('assetType', 'pump');
    fixture.componentRef.setInput('metricLabel', 'Pressure');
    fixture.componentRef.setInput('unit', 'psi');
    fixture.componentRef.setInput('value', 118.2);

    fixture.componentRef.setInput('status', 'operational');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.p-tag')?.className).toContain('p-tag-success');

    fixture.componentRef.setInput('status', 'standby');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.p-tag')?.className).toContain('p-tag-warn');

    fixture.componentRef.setInput('status', 'maintenance');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.p-tag')?.className).toContain('p-tag-danger');

    fixture.componentRef.setInput('status', 'unknown');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.p-tag')?.className).toContain('p-tag-info');
  });
});
