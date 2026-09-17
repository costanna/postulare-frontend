import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucidePlus } from '@lucide/angular';

import { Application, ApplicationStatus, KANBAN_STATUSES } from '../../core/models/application.model';
import { ApplicationsService } from '../../core/services/applications.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import {
  ApplicationFormDialogComponent,
  ApplicationFormDialogData,
} from '../applications/application-form-dialog/application-form-dialog.component';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    StatusBadgeComponent,
    LucidePlus,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
})
export class KanbanComponent implements OnInit {
  private readonly applicationsService = inject(ApplicationsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly columns = KANBAN_STATUSES;
  readonly loading = signal(true);
  readonly board = signal<Record<ApplicationStatus, Application[]>>(this.emptyBoard());

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    // Sube el page_size al máximo permitido por la API: el tablero muestra
    // el conjunto completo, no está paginado.
    this.applicationsService.list({ page_size: 100 }).subscribe((page) => {
      const board = this.emptyBoard();
      for (const app of page.items) {
        if (app.status in board) {
          board[app.status].push(app);
        }
      }
      this.board.set(board);
      this.loading.set(false);
    });
  }

  private emptyBoard(): Record<ApplicationStatus, Application[]> {
    return { saved: [], applied: [], interview: [], offer: [], rejected: [], withdrawn: [] };
  }

  drop(event: CdkDragDrop<Application[]>, newStatus: ApplicationStatus): void {
    const previousList = event.previousContainer.data;
    const currentList = event.container.data;

    if (event.previousContainer === event.container) {
      moveItemInArray(currentList, event.previousIndex, event.currentIndex);
      this.board.update((b) => ({ ...b }));
      return;
    }

    const application = previousList[event.previousIndex];
    const previousStatus = application.status;

    // Optimista: movemos la tarjeta ya mismo y revertimos si falla la API.
    previousList.splice(event.previousIndex, 1);
    currentList.splice(event.currentIndex, 0, { ...application, status: newStatus });
    this.board.update((b) => ({ ...b }));

    this.applicationsService.update(application.id, { status: newStatus }).subscribe({
      error: () => {
        currentList.splice(event.currentIndex, 1);
        previousList.splice(event.previousIndex, 0, { ...application, status: previousStatus });
        this.board.update((b) => ({ ...b }));
        this.translate.get('common.error_generic').subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 }));
      },
    });
  }

  openCreateDialog(status: ApplicationStatus): void {
    const data: ApplicationFormDialogData = { defaultStatus: status };
    this.dialog
      .open(ApplicationFormDialogComponent, { data, width: '100%', maxWidth: '600px' })
      .afterClosed()
      .subscribe((created?: Application) => {
        if (!created) return;
        this.board.update((b) => {
          const next = { ...b, [created.status]: [created, ...b[created.status]] };
          return next;
        });
      });
  }

  openDetail(application: Application): void {
    this.router.navigate(['/applications', application.id]);
  }
}
