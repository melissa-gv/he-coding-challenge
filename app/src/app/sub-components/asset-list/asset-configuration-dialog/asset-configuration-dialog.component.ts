import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ConfigurationApiService } from '../../../shared/api/configuration-api.service';
import {
  AssetConfiguration,
  MAINTENANCE_MODES,
  OPERATING_MODES,
  PRIORITY_LEVELS
} from '../../../shared/models/asset-configuration.models';
import { Asset } from '../../../shared/models/asset.models';

type ConfigurationField = keyof AssetConfiguration;

interface ApiValidationError {
  loc?: Array<string | number>;
  msg?: string;
}

const PRIORITY_SET = new Set<string>(PRIORITY_LEVELS);
const MAINTENANCE_MODE_SET = new Set<string>(MAINTENANCE_MODES);
const OPERATING_MODE_SET = new Set<string>(OPERATING_MODES);

@Component({
  selector: 'app-asset-configuration-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    MessageModule
  ],
  templateUrl: './asset-configuration-dialog.component.html',
  styleUrl: './asset-configuration-dialog.component.scss'
})
export class AssetConfigurationDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly configurationApi = inject(ConfigurationApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messageService = inject(MessageService);

  readonly visible = input<boolean>(false);
  readonly asset = input<Asset | null>(null);
  readonly visibleChange = output<boolean>();

  protected readonly isLoadingConfiguration = signal<boolean>(false);
  protected readonly isSaving = signal<boolean>(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitError = signal<string | null>(null);

  protected readonly priorityOptions = PRIORITY_LEVELS.map((value) => ({ label: this.toLabel(value), value }));
  protected readonly maintenanceModeOptions = MAINTENANCE_MODES.map((value) => ({ label: this.toLabel(value), value }));
  protected readonly operatingModeOptions = OPERATING_MODES.map((value) => ({ label: this.toLabel(value), value }));

  protected readonly dialogTitle = computed(() => {
    const asset = this.asset();
    return asset ? `Configure ${asset.name}` : 'Configure Asset';
  });

  protected readonly form = this.formBuilder.group({
    asset_id: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    priority: this.formBuilder.nonNullable.control('medium', [Validators.required, enumValidator(PRIORITY_SET)]),
    maintenance_mode: this.formBuilder.nonNullable.control('scheduled', [Validators.required, enumValidator(MAINTENANCE_MODE_SET)]),
    operating_mode: this.formBuilder.nonNullable.control('continuous', [Validators.required, enumValidator(OPERATING_MODE_SET)]),
    maintenance_interval_days: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(365),
      integerValidator()
    ]),
    max_runtime_hours: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(100000),
      integerValidator()
    ]),
    warning_threshold_percent: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
      integerValidator()
    ]),
    max_temperature_celsius: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(-50),
      Validators.max(200)
    ]),
    max_pressure_psi: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0), Validators.max(10000)]),
    efficiency_target_percent: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100)
    ]),
    power_factor: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(-1),
      Validators.max(1),
      notZeroValidator()
    ]),
    load_capacity_percent: this.formBuilder.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(150)
    ]),
    alert_email: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(255),
      backendEmailValidator()
    ]),
    location: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]),
    notes: this.formBuilder.control<string | null>('', [Validators.maxLength(500)])
  });

  constructor() {
    effect(() => {
      const isVisible = this.visible();
      const asset = this.asset();

      if (!isVisible || !asset) {
        return;
      }

      this.initializeForm(asset);
      this.loadExistingConfiguration(asset.id);
    });
  }

  protected onDialogVisibilityChange(nextVisible: boolean): void {
    this.visibleChange.emit(nextVisible);

    if (!nextVisible) {
      this.resetFeedback();
      this.clearServerErrors();
    }
  }

  protected submitConfiguration(): void {
    this.submitError.set(null);
    this.clearServerErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const payload: AssetConfiguration = {
      ...(this.form.getRawValue() as AssetConfiguration),
      notes: this.form.controls.notes.value?.trim() ? this.form.controls.notes.value?.trim() : null
    };

    this.configurationApi
      .saveConfiguration(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (configuration) => {
          this.form.patchValue({
            ...configuration,
            notes: configuration.notes ?? ''
          });
          this.isSaving.set(false);
          this.onDialogVisibilityChange(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Configuration Saved',
            detail: 'Configuration saved successfully.'
          });
        },
        error: (error: unknown) => {
          this.applyServerErrors(error);
          this.isSaving.set(false);
        }
      });
  }

  protected hasControlError(field: ConfigurationField): boolean {
    const control = this.form.controls[field];
    return !!control.errors && (control.touched || this.isSaving());
  }

  protected controlErrorMessage(field: ConfigurationField): string {
    const control = this.form.controls[field];
    const errors = control.errors;

    if (!errors) {
      return '';
    }

    if (typeof errors['server'] === 'string') {
      return errors['server'];
    }

    if (errors['required']) {
      return 'This field is required.';
    }

    if (errors['minlength']) {
      return `Must be at least ${errors['minlength'].requiredLength} characters.`;
    }

    if (errors['maxlength']) {
      return `Must be at most ${errors['maxlength'].requiredLength} characters.`;
    }

    if (errors['min']) {
      return `Must be at least ${errors['min'].min}.`;
    }

    if (errors['max']) {
      return `Must be at most ${errors['max'].max}.`;
    }

    if (errors['integer']) {
      return 'Must be a whole number.';
    }

    if (errors['notZero']) {
      return 'Power factor cannot be exactly zero.';
    }

    if (errors['backendEmail']) {
      return 'Must be a valid email address.';
    }

    if (errors['enum']) {
      return 'Invalid value selected.';
    }

    return 'Invalid value.';
  }

  private initializeForm(asset: Asset): void {
    this.resetFeedback();
    this.clearServerErrors();

    this.form.reset({
      asset_id: asset.id,
      name: asset.name,
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
      alert_email: '',
      location: asset.location,
      notes: ''
    });
  }

  private loadExistingConfiguration(assetId: string): void {
    this.isLoadingConfiguration.set(true);
    this.loadError.set(null);

    this.configurationApi
      .getConfiguration(assetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (configuration) => {
          this.form.patchValue({
            ...configuration,
            notes: configuration.notes ?? ''
          });
          this.isLoadingConfiguration.set(false);
        },
        error: (error: unknown) => {
          const httpError = error as HttpErrorResponse;

          if (httpError.status !== 404) {
            this.loadError.set('Unable to load existing configuration for this asset.');
          }

          this.isLoadingConfiguration.set(false);
        }
      });
  }

  private applyServerErrors(error: unknown): void {
    const httpError = error as HttpErrorResponse;
    const detail = httpError.error?.detail;

    if (httpError.status === 422 && Array.isArray(detail)) {
      let hasFieldErrors = false;

      (detail as ApiValidationError[]).forEach((entry) => {
        const field = this.extractFieldName(entry.loc);
        const message = entry.msg ?? 'Invalid value.';

        if (!field || !this.form.controls[field]) {
          return;
        }

        const control = this.form.controls[field];
        control.setErrors({
          ...(control.errors ?? {}),
          server: message
        });
        control.markAsTouched();
        hasFieldErrors = true;
      });

      this.submitError.set(hasFieldErrors ? 'Please review the highlighted fields and try again.' : 'Validation failed.');
      return;
    }

    if (typeof detail === 'string' && detail.trim()) {
      this.submitError.set(detail);
      return;
    }

    this.submitError.set('Unable to save configuration. Please try again.');
  }

  private extractFieldName(loc: Array<string | number> | undefined): ConfigurationField | null {
    if (!loc || loc.length < 2) {
      return null;
    }

    const field = loc[loc.length - 1];

    if (typeof field !== 'string') {
      return null;
    }

    return field as ConfigurationField;
  }

  private clearServerErrors(): void {
    (Object.keys(this.form.controls) as ConfigurationField[]).forEach((field) => {
      const control = this.form.controls[field];

      if (!control.errors?.['server']) {
        return;
      }

      const { server: _, ...remaining } = control.errors;
      control.setErrors(Object.keys(remaining).length ? remaining : null);
    });
  }

  private resetFeedback(): void {
    this.loadError.set(null);
    this.submitError.set(null);
  }

  private toLabel(value: string): string {
    return value
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}

function integerValidator(): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined) {
      return null;
    }

    return Number.isInteger(value) ? null : { integer: true };
  };
}

function notZeroValidator(): ValidatorFn {
  return (control: AbstractControl<number | null>): ValidationErrors | null => {
    return control.value === 0 ? { notZero: true } : null;
  };
}

function backendEmailValidator(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = (control.value ?? '').trim();

    if (!value) {
      return null;
    }

    const parts = value.split('@');
    const domain = parts[1] ?? '';
    return parts.length === 2 && domain.includes('.') ? null : { backendEmail: true };
  };
}

function enumValidator(validSet: Set<string>): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    return validSet.has(value) ? null : { enum: true };
  };
}
