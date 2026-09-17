import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  LucideBuilding2,
  LucideCheck,
  LucideExternalLink,
  LucideMapPin,
  LucideSearch,
  LucideX,
} from '@lucide/angular';

import { Match, MatchStatus } from '../../core/models/match.model';
import { MatchesService } from '../../core/services/matches.service';

const FILTERS: MatchStatus[] = ['new', 'converted', 'dismissed'];

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    LucideSearch,
    LucideExternalLink,
    LucideCheck,
    LucideX,
    LucideMapPin,
    LucideBuilding2,
  ],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',
})
export class MatchesComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly filters = FILTERS;
  readonly filter = signal<MatchStatus>('new');
  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly matches = signal<Match[]>([]);
  readonly convertingIds = signal<Set<string>>(new Set());
  readonly dismissingIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.load();
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

    this.matchesService.search().subscribe({
      next: (result) => {
        this.searching.set(false);
        if (result.new_matches === 0 && result.updated_matches === 0) {
          this.notify('matches.search_no_new');
        } else {
          this.notify('matches.search_success', { new: result.new_matches, updated: result.updated_matches });
        }
        if (this.filter() === 'new') {
          this.load();
        }
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
    if (err.status === 429) {
      this.notify('matches.error_rate_limited');
      return;
    }
    this.notify('matches.error_search_failed');
  }

  convert(match: Match): void {
    this.convertingIds.update((ids) => new Set(ids).add(match.id));
    this.matchesService.convert(match.id).subscribe({
      next: () => {
        this.convertingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(match.id);
          return next;
        });
        this.matches.update((current) => current.filter((m) => m.id !== match.id));
        this.notify('matches.convert_success');
      },
      error: () => {
        this.convertingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(match.id);
          return next;
        });
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

  private notify(key: string, params?: Record<string, unknown>): void {
    this.translate.get(key, params).subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 }));
  }
}
