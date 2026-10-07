import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideCheck, LucideCopy, LucideExternalLink, LucideMail } from '@lucide/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LANGUAGE_LABELS } from '../../../core/i18n/supported-languages';
import { ApplyPack, Match } from '../../../core/models/match.model';
import { MatchesService } from '../../../core/services/matches.service';

export interface SendCvDialogData {
  match: Match;
}

/**
 * Enviar el CV: el backend prepara el kit en el idioma de la oferta
 * (carta + CV + asunto/cuerpo de email + checklist) y aquí se copia o se
 * abre en el email propio con un enlace mailto. El envío lo hace el
 * usuario: el backend no tiene credenciales de correo de nadie.
 */
@Component({
  selector: 'app-send-cv-dialog',
  standalone: true,
  imports: [
    TranslatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LucideCheck,
    LucideCopy,
    LucideExternalLink,
    LucideMail,
  ],
  templateUrl: './send-cv-dialog.component.html',
  styleUrl: './send-cv-dialog.component.scss',
})
export class SendCvDialogComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly dialogRef = inject(MatDialogRef<SendCvDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly languageLabels = LANGUAGE_LABELS;

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly copiedKey = signal<string | null>(null);
  readonly pack = signal<ApplyPack | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: SendCvDialogData) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.matchesService.applyPack(this.data.match.id).subscribe({
      next: (pack) => {
        this.pack.set(pack);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  copy(key: string, text: string): void {
    navigator.clipboard.writeText(text).then(
      () => {
        this.copiedKey.set(key);
        setTimeout(() => this.copiedKey.set(null), 2000);
      },
      () => this.snackBar.open(this.translate.instant('send_cv.copy_failed'), undefined, { duration: 4000 })
    );
  }

  close(): void {
    this.dialogRef.close();
  }

  langLabel(code: string | null): string {
    if (code === 'ca' || code === 'es' || code === 'en') return this.languageLabels[code];
    return code ?? '';
  }
}
