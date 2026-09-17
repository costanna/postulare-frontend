import { Component, Inject, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import { APPLICATION_STATUSES, Application, ApplicationStatus } from '../../../core/models/application.model';
import { ApplicationsService } from '../../../core/services/applications.service';

export interface ApplicationFormDialogData {
  application?: Application;
  defaultStatus?: ApplicationStatus;
}

@Component({
  selector: 'app-application-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './application-form-dialog.component.html',
  styleUrl: './application-form-dialog.component.scss',
})
export class ApplicationFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly dialogRef = inject(MatDialogRef<ApplicationFormDialogComponent, Application | undefined>);

  readonly statuses = APPLICATION_STATUSES;
  readonly saving = signal(false);
  readonly isEdit: boolean;

  readonly form = this.fb.nonNullable.group({
    company_name: ['', [Validators.required, Validators.maxLength(255)]],
    position: ['', [Validators.required, Validators.maxLength(255)]],
    status: ['saved' as ApplicationStatus, [Validators.required]],
    source: [''],
    salary_range: [''],
    job_url: [''],
    applied_at: [null as Date | null],
    notes: [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: ApplicationFormDialogData) {
    this.isEdit = !!data.application;
    const app = data.application;
    this.form.patchValue({
      company_name: app?.company_name ?? '',
      position: app?.position ?? '',
      status: app?.status ?? data.defaultStatus ?? 'saved',
      source: app?.source ?? '',
      salary_range: app?.salary_range ?? '',
      job_url: app?.job_url ?? '',
      applied_at: app?.applied_at ? new Date(app.applied_at) : null,
      notes: app?.notes ?? '',
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      company_name: raw.company_name,
      position: raw.position,
      status: raw.status,
      source: raw.source || null,
      salary_range: raw.salary_range || null,
      job_url: raw.job_url || null,
      notes: raw.notes || null,
      applied_at: raw.applied_at ? this.toIsoDate(raw.applied_at) : null,
    };

    const request$ = this.data.application
      ? this.applicationsService.update(this.data.application.id, payload)
      : this.applicationsService.create(payload);

    request$.subscribe({
      next: (application) => {
        this.saving.set(false);
        this.dialogRef.close(application);
      },
      error: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
