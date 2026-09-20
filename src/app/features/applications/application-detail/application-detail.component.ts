import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideArrowLeft, LucideExternalLink, LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';

import { Application } from '../../../core/models/application.model';
import { ApplicationEvent } from '../../../core/models/event.model';
import { ApplicationsService } from '../../../core/services/applications.service';
import { ApplyFlowService } from '../../../core/services/apply-flow.service';
import { EventsService } from '../../../core/services/events.service';
import { LocalDatePipe } from '../../../shared/pipes/local-date.pipe';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ApplicationFormDialogComponent } from '../application-form-dialog/application-form-dialog.component';
import { EventFormDialogComponent, EventFormDialogData } from '../event-form-dialog/event-form-dialog.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    LocalDatePipe,
    LucideArrowLeft,
    LucidePencil,
    LucideTrash2,
    LucidePlus,
    LucideExternalLink,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly eventsService = inject(EventsService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly applyFlow = inject(ApplyFlowService);

  private readonly applicationId = this.route.snapshot.paramMap.get('id')!;

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly application = signal<Application | null>(null);
  readonly events = signal<ApplicationEvent[]>([]);
  readonly eventsLoading = signal(true);
  readonly eventsError = signal(false);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.applicationsService.get(this.applicationId).subscribe({
      next: (application) => {
        this.application.set(application);
        this.loading.set(false);
        this.loadEvents();
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  retryEvents(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.eventsLoading.set(true);
    this.eventsError.set(false);
    this.eventsService.list(this.applicationId).subscribe({
      next: (events) => {
        this.events.set(events);
        this.eventsLoading.set(false);
      },
      error: () => {
        this.eventsLoading.set(false);
        this.eventsError.set(true);
      },
    });
  }

  back(): void {
    this.router.navigate(['/applications']);
  }

  /** Abre la página de la oferta y pregunta si ya se ha aplicado; solo entonces pasa a "aplicada". */
  apply(): void {
    const application = this.application();
    if (!application) return;

    if (!this.applyFlow.openOffer(application.job_url)) {
      this.snackBar.open(this.translate.instant('matches.popup_blocked'), undefined, { duration: 5000 });
    }
    this.applyFlow.confirmApplied(application).subscribe({
      next: (updated) => {
        if (updated) {
          this.application.set(updated);
          this.loadEvents();
        }
        this.snackBar.open(
          this.translate.instant(updated ? 'apply_dialog.marked' : 'apply_dialog.kept_saved'),
          undefined,
          { duration: 4000 }
        );
      },
      error: () => this.snackBar.open(this.translate.instant('common.error_generic'), undefined, { duration: 4000 }),
    });
  }

  /** El backend guarda los cambios de estado como "saved → applied": se muestran con los nombres traducidos. */
  eventText(event: ApplicationEvent): string {
    const change = event.type === 'status_change' ? /^(\w+) → (\w+)$/.exec(event.description ?? '') : null;
    if (!change) return event.description ?? '';
    return `${this.translate.instant('status.' + change[1])} → ${this.translate.instant('status.' + change[2])}`;
  }

  openEditDialog(): void {
    const application = this.application();
    if (!application) return;

    this.dialog
      .open(ApplicationFormDialogComponent, { data: { application }, width: '100%', maxWidth: '600px' })
      .afterClosed()
      .subscribe((updated?: Application) => {
        if (!updated) return;
        this.application.set(updated);
      });
  }

  deleteApplication(): void {
    const application = this.application();
    if (!application) return;

    const data: ConfirmDialogData = {
      title: this.translate.instant('applications.confirm_delete_title'),
      message: this.translate.instant('applications.confirm_delete_message', {
        position: application.position,
        company: application.company_name,
      }),
    };

    this.dialog
      .open(ConfirmDialogComponent, { data, width: '90%', maxWidth: '420px' })
      .afterClosed()
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) return;
        this.applicationsService.delete(application.id).subscribe({
          next: () => this.router.navigate(['/applications']),
          error: () =>
            this.translate
              .get('common.error_generic')
              .subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 })),
        });
      });
  }

  openAddEventDialog(): void {
    const data: EventFormDialogData = { applicationId: this.applicationId };
    this.dialog
      .open(EventFormDialogComponent, { data, width: '100%', maxWidth: '480px' })
      .afterClosed()
      .subscribe((created?: ApplicationEvent) => {
        if (!created) return;
        this.events.update((current) => [created, ...current]);
      });
  }

  deleteEvent(event: ApplicationEvent): void {
    this.eventsService.delete(event.id).subscribe({
      next: () => this.events.update((current) => current.filter((e) => e.id !== event.id)),
      error: () =>
        this.translate
          .get('common.error_generic')
          .subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 })),
    });
  }
}
