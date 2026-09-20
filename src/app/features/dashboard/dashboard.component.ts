import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import {
  LucideAward,
  LucideClipboardList,
  LucideMessageSquare,
  LucideSend,
  LucideTrendingUp,
  LucideXCircle,
} from '@lucide/angular';
import { forkJoin } from 'rxjs';

import { SourceCount, StatsSummary, StatusCount, TimelinePoint } from '../../core/models/stats.model';
import { LanguageService } from '../../core/services/language.service';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideClipboardList,
    LucideSend,
    LucideMessageSquare,
    LucideAward,
    LucideXCircle,
    LucideTrendingUp,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly language = inject(LanguageService);

  readonly loading = signal(true);
  readonly loadError = signal(false);

  readonly summary = signal<StatsSummary | null>(null);
  readonly byStatus = signal<StatusCount[]>([]);
  readonly timeline = signal<TimelinePoint[]>([]);
  readonly bySource = signal<SourceCount[]>([]);

  readonly maxStatusCount = computed(() => Math.max(1, ...this.byStatus().map((s) => s.count)));
  readonly maxTimelineCount = computed(() => Math.max(1, ...this.timeline().map((t) => t.count)));
  readonly maxSourceCount = computed(() => Math.max(1, ...this.bySource().map((s) => s.count)));

  ngOnInit(): void {
    this.load();
  }

  retry(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    forkJoin({
      summary: this.statsService.getSummary(),
      byStatus: this.statsService.getByStatus(),
      timeline: this.statsService.getTimeline(),
      bySource: this.statsService.getBySource(),
    }).subscribe({
      next: ({ summary, byStatus, timeline, bySource }) => {
        this.summary.set(summary);
        this.byStatus.set(byStatus);
        this.timeline.set(timeline);
        this.bySource.set(bySource);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  statusBarWidth(count: number): number {
    return Math.round((count / this.maxStatusCount()) * 100);
  }

  timelineBarHeight(count: number): number {
    // Deja un mínimo visible incluso para meses con 1 candidatura.
    return Math.max(6, Math.round((count / this.maxTimelineCount()) * 100));
  }

  sourceBarWidth(count: number): number {
    return Math.round((count / this.maxSourceCount()) * 100);
  }

  monthLabel(month: string): string {
    const [year, monthIndex] = month.split('-').map(Number);
    const date = new Date(year, (monthIndex || 1) - 1, 1);
    // "jul '26" (compacto): con `{ month: 'short', year: '2-digit' }` catalán
    // da "jul. del 26", demasiado ancho y las etiquetas se pisan.
    const monthName = new Intl.DateTimeFormat(this.language.current(), { month: 'short' }).format(date).replace('.', '');
    return `${monthName} '${String(year).slice(2)}`;
  }
}
