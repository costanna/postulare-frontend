import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

import { APPLICATION_STATUSES } from '../../core/models/application.model';
import { SourceCount, StatsSummary, StatusCount, TimelinePoint } from '../../core/models/stats.model';
import { LanguageService } from '../../core/services/language.service';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TranslatePipe,
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

  readonly statuses = APPLICATION_STATUSES;
  readonly loading = signal(true);

  readonly summary = signal<StatsSummary | null>(null);
  readonly byStatus = signal<StatusCount[]>([]);
  readonly timeline = signal<TimelinePoint[]>([]);
  readonly bySource = signal<SourceCount[]>([]);

  readonly maxStatusCount = computed(() => Math.max(1, ...this.byStatus().map((s) => s.count)));
  readonly maxTimelineCount = computed(() => Math.max(1, ...this.timeline().map((t) => t.count)));
  readonly maxSourceCount = computed(() => Math.max(1, ...this.bySource().map((s) => s.count)));

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      summary: this.statsService.getSummary(),
      byStatus: this.statsService.getByStatus(),
      timeline: this.statsService.getTimeline(),
      bySource: this.statsService.getBySource(),
    }).subscribe(({ summary, byStatus, timeline, bySource }) => {
      this.summary.set(summary);
      this.byStatus.set(byStatus);
      this.timeline.set(timeline);
      this.bySource.set(bySource);
      this.loading.set(false);
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
    return new Intl.DateTimeFormat(this.language.current(), { month: 'short', year: '2-digit' }).format(date);
  }
}
