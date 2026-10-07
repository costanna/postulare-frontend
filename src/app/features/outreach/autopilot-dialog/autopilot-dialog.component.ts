import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideSend } from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { TargetPreview } from '../../../core/models/outreach.model';
import { OutreachService } from '../../../core/services/outreach.service';

/** El piloto muestra las cartas que enviaría; el envío se confirma aquí mismo. */
@Component({
  selector: 'app-autopilot-dialog',
  standalone: true,
  imports: [TranslatePipe, MatDialogModule, MatButtonModule, MatProgressSpinnerModule, LucideSend],
  templateUrl: './autopilot-dialog.component.html',
  styleUrl: './autopilot-dialog.component.scss',
})
export class AutopilotDialogComponent implements OnInit {
  private readonly outreach = inject(OutreachService);
  private readonly dialogRef = inject(MatDialogRef<AutopilotDialogComponent, boolean>);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly previews = signal<TargetPreview[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.outreach.previewAutopilot(5).subscribe({
      next: (previews) => {
        this.previews.set(previews);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
