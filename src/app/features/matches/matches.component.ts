import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  LucideBuilding2,
  LucideExternalLink,
  LucideFileText,
  LucideMapPin,
  LucideRotateCcw,
  LucideSearch,
  LucideSlidersHorizontal,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';
import { Observable, of, switchMap, tap } from 'rxjs';

import { Application } from '../../core/models/application.model';
import { CoverLetter, DisabilityFilter, Match, MatchStatus, SearchFilters, SearchFiltersState } from '../../core/models/match.model';
import { ApplyFlowService } from '../../core/services/apply-flow.service';
import { MatchesService } from '../../core/services/matches.service';
import { keywordTokens, toggleTerm } from '../../core/data/programming-keywords';
import { KeywordSuggestionsComponent } from '../../shared/ui/keyword-suggestions/keyword-suggestions.component';
import { CoverLetterDialogComponent, CoverLetterDialogData } from './cover-letter-dialog/cover-letter-dialog.component';

const FILTERS: MatchStatus[] = ['new', 'converted', 'dismissed'];

const SOURCE_LABELS: Record<string, string> = { adzuna: 'Adzuna', infojobs: 'InfoJobs', demo: 'Demo' };

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    KeywordSuggestionsComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    LucideRotateCcw,
    LucideSlidersHorizontal,
    LucideSearch,
    LucideExternalLink,
    LucideX,
    LucideMapPin,
    LucideBuilding2,
    LucideFileText,
    LucideTriangleAlert,
  ],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',
})
export class MatchesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly matchesService = inject(MatchesService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly applyFlow = inject(ApplyFlowService);
  private readonly translate = inject(TranslateService);

  readonly filters = FILTERS;
  readonly filter = signal<MatchStatus>('new');
  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly matches = signal<Match[]>([]);
  readonly convertingIds = signal<Set<string>>(new Set());
  readonly dismissingIds = signal<Set<string>>(new Set());

  readonly radiusOptions = [10, 30, 50, 100];
  readonly daysOptions: (number | null)[] = [null, 7, 14, 30, 60];
  readonly disabilityOptions: DisabilityFilter[] = ['any', 'require', 'exclude'];

  readonly searchForm = this.fb.group({
    keywords: [''],
    location: [''],
    radius_km: [30],
    exclude: [''],
    exclude_other_levels: [true],
    disability: ['any' as DisabilityFilter],
    max_days_old: [null as number | null],
    min_score: [0],
  });
  readonly searchState = signal<SearchFiltersState | null>(null);
  readonly savingFilters = signal(false);
  readonly keywordSelection = signal<string[]>([]);
  /** Solo afecta a la vista (oculta ofertas con menos puntuación); se aplica al mover el slider. */
  readonly minScore = signal(0);

  /** La puntuación mínima solo se aplica a las "nuevas": las ya gestionadas se ven siempre. */
  readonly visibleMatches = computed(() =>
    this.filter() === 'new' ? this.matches().filter((m) => m.score >= this.minScore()) : this.matches()
  );
  readonly hiddenCount = computed(() => this.matches().length - this.visibleMatches().length);

  ngOnInit(): void {
    this.load();
    this.loadFilters();
    this.searchForm.controls.min_score.valueChanges.subscribe((value) => this.minScore.set(value ?? 0));
    this.searchForm.controls.keywords.valueChanges.subscribe((value) => this.keywordSelection.set(keywordTokens(value)));
  }

  private loadFilters(): void {
    // Si falla no bloquea la página: el formulario se queda con los valores por defecto.
    this.matchesService.getFilters().subscribe({ next: (state) => this.applyState(state, true) });
  }

  private applyState(state: SearchFiltersState, patchForm: boolean): void {
    this.searchState.set(state);
    this.minScore.set(state.filters.min_score);
    if (patchForm) {
      const f = state.filters;
      this.searchForm.reset({
        keywords: f.keywords ?? '',
        location: f.location ?? '',
        radius_km: f.radius_km,
        exclude: f.exclude ?? '',
        exclude_other_levels: f.exclude_other_levels,
        disability: f.disability ?? 'any',
        max_days_old: f.max_days_old,
        min_score: f.min_score,
      });
    } else {
      this.searchForm.markAsPristine();
    }
  }

  private payload(): SearchFilters {
    const v = this.searchForm.getRawValue();
    return {
      keywords: v.keywords?.trim() || null,
      location: v.location?.trim() || null,
      radius_km: v.radius_km ?? 30,
      exclude: v.exclude?.trim() || null,
      exclude_other_levels: v.exclude_other_levels ?? true,
      disability: v.disability ?? 'any',
      max_days_old: v.max_days_old,
      min_score: v.min_score ?? 0,
    };
  }

  toggleKeyword(term: string): void {
    const control = this.searchForm.controls.keywords;
    control.setValue(toggleTerm(keywordTokens(control.value), term).join(' '));
    control.markAsDirty();
  }

  sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
  }

  saveFilters(): void {
    if (this.savingFilters()) return;
    this.savingFilters.set(true);
    this.matchesService.saveFilters(this.payload()).subscribe({
      next: (state) => {
        this.savingFilters.set(false);
        this.applyState(state, true);
        this.notify('matches.filters_saved');
      },
      error: () => {
        this.savingFilters.set(false);
        this.notify('common.error_generic');
      },
    });
  }

  resetFilters(): void {
    this.searchForm.reset({
      keywords: '',
      location: '',
      radius_km: 30,
      exclude: '',
      exclude_other_levels: true,
      disability: 'any',
      max_days_old: null,
      min_score: 0,
    });
    this.saveFilters();
  }

  private load(): void {
    this.loading.set(true);
    this.matchesService.list(this.filter()).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notify('common.error_generic');
      },
    });
  }

  setFilter(status: MatchStatus): void {
    if (this.filter() === status) return;
    this.filter.set(status);
    this.load();
  }

  search(): void {
    if (this.searching()) return;
    this.searching.set(true);

    // La búsqueda usa los filtros GUARDADOS: si hay cambios sin guardar se
    // guardan primero, para que "Cerca ofertes" haga lo que se ve en pantalla.
    const save$: Observable<unknown> = this.searchForm.dirty
      ? this.matchesService.saveFilters(this.payload()).pipe(tap((state) => this.applyState(state, false)))
      : of(null);

    save$.pipe(switchMap(() => this.matchesService.search())).subscribe({
      next: (result) => {
        this.searching.set(false);
        if (result.new_matches === 0 && result.updated_matches === 0) {
          this.notify(result.skipped_duplicates > 0 ? 'matches.search_only_duplicates' : 'matches.search_no_new', {
            skipped: result.skipped_duplicates,
          });
        } else if (result.skipped_duplicates > 0) {
          this.notify('matches.search_success_with_duplicates', {
            new: result.new_matches,
            updated: result.updated_matches,
            skipped: result.skipped_duplicates,
          });
        } else {
          this.notify('matches.search_success', { new: result.new_matches, updated: result.updated_matches });
        }
        if (this.filter() === 'new') {
          this.load();
        }
        this.refreshQuota();
      },
      error: (err: HttpErrorResponse) => {
        this.searching.set(false);
        this.handleSearchError(err);
      },
    });
  }

  private handleSearchError(err: HttpErrorResponse): void {
    if (err.status === 400) {
      this.snackBar
        .open(this.translate.instant('matches.error_profile_incomplete'), this.translate.instant('nav.profile'), {
          duration: 6000,
        })
        .onAction()
        .subscribe(() => this.router.navigate(['/profile']));
      return;
    }
    if (err.status === 403) {
      this.notify('matches.error_demo_search');
      return;
    }
    if (err.status === 429) {
      this.notify('matches.error_rate_limited');
      return;
    }
    if (err.status === 503) {
      // Tope diario global de la demo (cuota compartida de Adzuna), no un fallo.
      this.notify('matches.error_daily_limit');
      this.refreshQuota();
      return;
    }
    this.notify('matches.error_search_failed');
  }

  /** Actualiza solo el contador de búsquedas restantes, sin pisar lo que se esté editando. */
  private refreshQuota(): void {
    this.matchesService.getFilters().subscribe({
      next: (state) =>
        this.searchState.update((current) =>
          current ? { ...current, daily_remaining: state.daily_remaining } : state
        ),
    });
  }

  convert(match: Match): void {
    this.saveAsApplication(match, () => this.notify('matches.convert_success'));
  }

  /** Abre la página de la oferta, la deja guardada como candidatura y pregunta si ya se ha aplicado. */
  apply(match: Match): void {
    if (!this.applyFlow.openOffer(match.job_offer.url)) {
      this.notify('matches.popup_blocked');
    }
    this.saveAsApplication(match, (application) =>
      this.applyFlow.confirmApplied(application).subscribe({
        next: (updated) => this.notify(updated ? 'apply_dialog.marked' : 'apply_dialog.kept_saved'),
        error: () => this.notify('common.error_generic'),
      })
    );
  }

  private saveAsApplication(match: Match, done: (application: Application) => void): void {
    this.convertingIds.update((ids) => new Set(ids).add(match.id));
    const finish = () =>
      this.convertingIds.update((ids) => {
        const next = new Set(ids);
        next.delete(match.id);
        return next;
      });

    this.matchesService.convert(match.id).subscribe({
      next: (application) => {
        finish();
        this.matches.update((current) => current.filter((m) => m.id !== match.id));
        done(application);
      },
      error: () => {
        finish();
        this.notify('common.error_generic');
      },
    });
  }

  dismiss(match: Match): void {
    this.dismissingIds.update((ids) => new Set(ids).add(match.id));
    this.matchesService.dismiss(match.id).subscribe({
      next: () => {
        this.dismissingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(match.id);
          return next;
        });
        this.matches.update((current) => current.filter((m) => m.id !== match.id));
        this.notify('matches.dismiss_success');
      },
      error: () => {
        this.dismissingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(match.id);
          return next;
        });
        this.notify('common.error_generic');
      },
    });
  }

  openCoverLetter(match: Match): void {
    const data: CoverLetterDialogData = { match };
    this.dialog
      .open<CoverLetterDialogComponent, CoverLetterDialogData, CoverLetter | undefined>(CoverLetterDialogComponent, {
        data,
        width: '640px',
        maxWidth: '95vw',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .subscribe((letter) => {
        if (!letter) return;
        this.matches.update((current) =>
          current.map((m) =>
            m.id === match.id
              ? {
                  ...m,
                  cover_letter: letter.cover_letter,
                  cover_letter_source: letter.source,
                  cover_letter_at: letter.generated_at,
                }
              : m
          )
        );
      });
  }

  private notify(key: string, params?: Record<string, unknown>): void {
    this.translate.get(key, params).subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 }));
  }
}
