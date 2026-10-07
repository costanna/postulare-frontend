import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideCheck, LucideCopy, LucideExternalLink, LucideMail, LucideSend } from '@lucide/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { LANGUAGE_LABELS } from '../../../core/i18n/supported-languages';
import { ApplyPack, Match } from '../../../core/models/match.model';
import { AuthService } from '../../../core/services/auth.service';
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
    LucideSend,
  ],
  templateUrl: './send-cv-dialog.component.html',
  styleUrl: './send-cv-dialog.component.scss',
})
export class SendCvDialogComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly auth = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<SendCvDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly languageLabels = LANGUAGE_LABELS;

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly copiedKey = signal<string | null>(null);
  readonly sending = signal(false);
  readonly sentTo = signal<string | null>(null);
  readonly pack = signal<ApplyPack | null>(null);

  /** La demo no puede enviar emails (el backend responde 403): se oculta el botón. */
  readonly isDemo = computed(() => this.auth.currentUser()?.is_demo ?? true);

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

  /** Envío directo desde el servidor (solo cuentas reales y con email de contacto). */
  sendNow(): void {
    if (this.sending() || !this.pack()?.contact_email) return;
    this.sending.set(true);
    this.matchesService.sendEmail(this.data.match.id).subscribe({
      next: (result) => {
        this.sending.set(false);
        this.sentTo.set(result.sent_to);
        this.translate
          .get('send_cv.sent', { email: result.sent_to })
          .subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 6000 }));
      },
      error: (err: { status?: number }) => {
        this.sending.set(false);
        const key =
          err.status === 503
            ? 'send_cv.error_config'
            : err.status === 429
              ? 'send_cv.error_limit'
              : 'common.error_generic';
        this.translate.get(key).subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 }));
      },
    });
  }

  langLabel(code: string | null): string {
    if (code === 'ca' || code === 'es' || code === 'en') return this.languageLabels[code];
    return code ?? '';
  }
}
