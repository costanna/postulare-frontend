import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideCircleCheck, LucideFileText, LucideSparkles, LucideX } from '@lucide/angular';

import { AppLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../core/i18n/supported-languages';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';
import { CvImportResult, Seniority } from '../../core/models/user.model';

const SENIORITY_OPTIONS: Seniority[] = ['junior', 'mid', 'senior'];

/** Mismo tope que el backend (CV_MAX_BYTES): se comprueba antes para no subir un PDF que se va a rechazar. */
export const CV_MAX_BYTES = 2_000_000;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    LucideSparkles,
    LucideX,
    LucideCircleCheck,
    LucideFileText,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly language = inject(LanguageService);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);

  readonly seniorityOptions = SENIORITY_OPTIONS;
  readonly languages = SUPPORTED_LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly skills = signal<string[]>([]);
  readonly importing = signal(false);
  readonly importError = signal<string | null>(null);
  /** La propuesta del CV ya está volcada en el formulario, pendiente de que el usuario la revise y guarde. */
  readonly cvApplied = signal(false);
  readonly showWelcome = signal(this.route.snapshot.queryParamMap.get('welcome') === '1');

  readonly form = this.fb.group({
    full_name: [''],
    location: [''],
    desired_position: [''],
    seniority: [null as Seniority | null],
    min_salary: [null as number | null, [Validators.min(0)]],
    preferred_language: ['es' as AppLanguage],
    about: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.form.patchValue({
          full_name: profile.full_name ?? '',
          location: profile.location ?? '',
          desired_position: profile.desired_position ?? '',
          seniority: profile.seniority,
          min_salary: profile.min_salary,
          preferred_language: profile.preferred_language,
          about: profile.about ?? '',
        });
        this.skills.set(profile.skills ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.skills().includes(value)) {
      this.skills.update((current) => [...current, value]);
    }
    event.chipInput?.clear();
  }

  removeSkill(skill: string): void {
    this.skills.update((current) => current.filter((s) => s !== skill));
  }

  /** Sube el PDF y vuelca la propuesta en el formulario. NO guarda: el usuario revisa y pulsa Guardar. */
  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo fichero
    if (!file || this.importing()) return;

    this.importError.set(null);
    this.cvApplied.set(false);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.importError.set('profile.import_error_not_pdf');
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      this.importError.set('profile.import_error_size');
      return;
    }

    this.importing.set(true);
    this.profileService.importCv(file).subscribe({
      next: (proposal) => {
        this.applyCvProposal(proposal);
        this.importing.set(false);
        this.cvApplied.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.importing.set(false);
        this.importError.set(
          err.status === 413
            ? 'profile.import_error_size'
            : err.status === 415
              ? 'profile.import_error_not_pdf'
              : err.status === 422
                ? 'profile.import_error_no_text'
                : err.status === 429
                  ? 'auth.error_too_many_requests'
                  : 'common.error_generic'
        );
      },
    });
  }

  /** El nombre solo se rellena si está vacío; el resto de datos del CV mandan cuando vienen. */
  private applyCvProposal(proposal: CvImportResult): void {
    const current = this.form.getRawValue();
    this.form.patchValue({
      full_name: current.full_name || proposal.full_name || '',
      desired_position: proposal.desired_position ?? current.desired_position,
      location: proposal.location ?? current.location,
      seniority: proposal.seniority ?? current.seniority,
      about: proposal.about ?? current.about,
    });

    // Las del CV van primero (la búsqueda usa las primeras); se conservan las que ya tenías añadidas a mano.
    const proposed = proposal.skills;
    const known = new Set(proposed.map((s) => s.toLowerCase()));
    this.skills.set([...proposed, ...this.skills().filter((s) => !known.has(s.toLowerCase()))]);
    this.form.markAsDirty();
  }

  onLanguageSelected(lang: AppLanguage): void {
    this.language.use(lang);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();

    this.profileService
      .updateProfile({
        full_name: raw.full_name || null,
        location: raw.location || null,
        desired_position: raw.desired_position || null,
        seniority: raw.seniority,
        min_salary: raw.min_salary,
        preferred_language: raw.preferred_language ?? undefined,
        about: raw.about?.trim() || null,
        skills: this.skills(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showWelcome.set(false);
          this.cvApplied.set(false);
          this.translate.get('profile.save_success').subscribe((msg) => {
            this.snackBar.open(msg, undefined, { duration: 3000 });
          });
        },
        error: () => {
          this.saving.set(false);
          this.translate.get('common.error_generic').subscribe((msg) => {
            this.snackBar.open(msg, undefined, { duration: 4000 });
          });
        },
      });
  }
}
