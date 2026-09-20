import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LucideCheck, LucideCopy, LucideRefreshCw, LucideSparkles } from '@lucide/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AppLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../../core/i18n/supported-languages';
import { CoverLetter, Match } from '../../../core/models/match.model';
import { LanguageService } from '../../../core/services/language.service';
import { MatchesService } from '../../../core/services/matches.service';

export interface CoverLetterDialogData {
  match: Match;
}

/**
 * Carta de presentación de una oferta. El backend siempre devuelve una: con IA si
 * hay clave y cuota, y con una plantilla gratuita en cualquier otro caso (y explica
 * por qué en `template_reason`). La carta se puede editar aquí antes de copiarla;
 * lo que se guarda en el servidor es la versión generada.
 */
@Component({
  selector: 'app-cover-letter-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    LucideCopy,
    LucideCheck,
    LucideRefreshCw,
    LucideSparkles,
  ],
  templateUrl: './cover-letter-dialog.component.html',
  styleUrl: './cover-letter-dialog.component.scss',
})
export class CoverLetterDialogComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly dialogRef = inject(MatDialogRef<CoverLetterDialogComponent, CoverLetter | undefined>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly languages = SUPPORTED_LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly copied = signal(false);
  readonly letter = signal<CoverLetter | null>(null);
  readonly language = signal<AppLanguage>(inject(LanguageService).current());
  readonly text = new FormControl('', { nonNullable: true });

  constructor(@Inject(MAT_DIALOG_DATA) public data: CoverLetterDialogData) {}

  ngOnInit(): void {
    // Si ya hay una carta guardada el backend la devuelve tal cual, sin gastar IA.
    this.generate(false);
  }

  generate(regenerate: boolean): void {
    this.loading.set(true);
    this.failed.set(false);
    this.matchesService.coverLetter(this.data.match.id, { language: this.language(), regenerate }).subscribe({
      next: (letter) => {
        this.letter.set(letter);
        if (letter.language) this.language.set(letter.language);
        this.text.setValue(letter.cover_letter);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  changeLanguage(lang: AppLanguage): void {
    this.language.set(lang);
    this.generate(true);
  }

  copy(): void {
    navigator.clipboard.writeText(this.text.value).then(
      () => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      },
      () => this.snackBar.open(this.translate.instant('cover_letter.copy_failed'), undefined, { duration: 4000 })
    );
  }

  close(): void {
    this.dialogRef.close(this.letter() ?? undefined);
  }
}
