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

import { ApplicationEvent, EVENT_TYPES, EventType } from '../../../core/models/event.model';
import { EventsService } from '../../../core/services/events.service';

export interface EventFormDialogData {
  applicationId: string;
}

@Component({
  selector: 'app-event-form-dialog',
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
  templateUrl: './event-form-dialog.component.html',
  styleUrl: './event-form-dialog.component.scss',
})
export class EventFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly eventsService = inject(EventsService);
  private readonly dialogRef = inject(MatDialogRef<EventFormDialogComponent, ApplicationEvent | undefined>);

  readonly types = EVENT_TYPES;
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    type: ['note' as EventType, [Validators.required]],
    description: [''],
    event_date: [new Date(), [Validators.required]],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: EventFormDialogData) {}

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();

    this.eventsService
      .create(this.data.applicationId, {
        type: raw.type,
        description: raw.description || null,
        event_date: raw.event_date.toISOString(),
      })
      .subscribe({
        next: (event) => {
          this.saving.set(false);
          this.dialogRef.close(event);
        },
        error: () => this.saving.set(false),
      });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
