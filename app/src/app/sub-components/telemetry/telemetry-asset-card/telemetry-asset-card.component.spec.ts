import { TestBed } from '@angular/core/testing';
import { TelemetryAssetCardComponent } from './telemetry-asset-card.component';

describe('TelemetryAssetCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryAssetCardComponent]
    }).compileComponents();
  });

  it('renders asset name, type, status, and metric rows', () => {
    const fixture = TestBed.createComponent(TelemetryAssetCardComponent);

    fixture.componentRef.setInput('assetName', 'Primary Cooling Pump');
    fixture.componentRef.setInput('assetType', 'pump');
    fixture.componentRef.setInput('status', 'operational');
    fixture.componentRef.setInput('metrics', [
      { key: 'temperature', label: 'Temperature', unit: 'Celsius', value: 71.4 },
      { key: 'pressure', label: 'Pressure', unit: 'psi', value: 118.2 }
    ]);

    fixture.detectChanges();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('Primary Cooling Pump');
    expect(content.toLowerCase()).toContain('pump');
    expect(content).toContain('Operational');
    expect(content).toContain('Temperature');
    expect(content).toContain('71.4');
    expect(content).toContain('Pressure');
    expect(content).toContain('118.2');
  });

  it('maps status values to expected p-tag severity classes', () => {
    const fixture = TestBed.createComponent(TelemetryAssetCardComponent);

    fixture.componentRef.setInput('assetName', 'Primary Cooling Pump');
    fixture.componentRef.setInput('assetType', 'pump');
    fixture.componentRef.setInput('metrics', []);

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
