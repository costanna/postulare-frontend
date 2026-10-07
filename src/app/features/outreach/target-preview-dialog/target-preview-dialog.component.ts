import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideSend } from '@lucide/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { TargetPreview } from '../../../core/models/outreach.model';
import { OutreachService } from '../../../core/services/outreach.service';

export interface TargetPreviewDialogData {
  targetId: string;
}

/** Vista previa de una espontánea: ves la carta (editable) antes de enviar. */
@Component({
  selector: 'app-target-preview-dialog',
  standalone: true,
  imports: [
    TranslatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LucideSend,
  ],
  templateUrl: './target-preview-dialog.component.html',
  styleUrl: './target-preview-dialog.component.scss',
})
export class TargetPreviewDialogComponent implements OnInit {
  private readonly outreach = inject(OutreachService);
  private readonly dialogRef = inject(MatDialogRef<TargetPreviewDialogComponent, string | undefined>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly sending = signal(false);
  readonly preview = signal<TargetPreview | null>(null);
  readonly letter = signal('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: TargetPreviewDialogData) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.outreach.preview(this.data.targetId).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.letter.set(preview.cover_letter);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  send(): void {
    const current = this.preview();
    if (this.sending() || !current) return;
    this.sending.set(true);
    const edited = this.letter().trim();
    this.outreach.send(current.target.id, edited && edited !== current.cover_letter.trim() ? edited : undefined).subscribe({
      next: (result) => {
        this.sending.set(false);
        this.dialogRef.close(result.sent_to);
      },
      error: (err: { status?: number }) => {
        this.sending.set(false);
        const key =
          err.status === 429
            ? 'send_cv.error_limit'
            : err.status === 503
              ? 'send_cv.error_config'
              : 'common.error_generic';
        this.translate.get(key).subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 }));
      },
    });
  }

  close(): void {
    this.dialogRef.close(undefined);
  }
}
