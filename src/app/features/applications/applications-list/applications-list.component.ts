import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { APPLICATION_STATUSES, Application, ApplicationStatus, Page } from '../../../core/models/application.model';
import { ApplicationsService } from '../../../core/services/applications.service';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { ApplicationFormDialogComponent } from '../application-form-dialog/application-form-dialog.component';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideX,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './applications-list.component.html',
  styleUrl: './applications-list.component.scss',
})
export class ApplicationsListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly applicationsService = inject(ApplicationsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly statuses = APPLICATION_STATUSES;
  readonly loading = signal(true);
  readonly page = signal<Page<Application> | null>(null);
  readonly currentPage = signal(1);

  readonly filtersForm = this.fb.group({
    company: [''],
    status: [null as ApplicationStatus | null],
    date_from: [null as Date | null],
    date_to: [null as Date | null],
  });

  ngOnInit(): void {
    this.load();

    this.filtersForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))).subscribe(() => {
      this.currentPage.set(1);
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    const raw = this.filtersForm.getRawValue();

    this.applicationsService
      .list({
        status: raw.status ?? undefined,
        company: raw.company || undefined,
        date_from: raw.date_from ? this.toIsoDate(raw.date_from) : undefined,
        date_to: raw.date_to ? this.toIsoDate(raw.date_to) : undefined,
        page: this.currentPage(),
        page_size: PAGE_SIZE,
      })
      .subscribe((page) => {
        this.page.set(page);
        this.loading.set(false);
      });
  }

  hasActiveFilters(): boolean {
    const raw = this.filtersForm.getRawValue();
    return !!(raw.company || raw.status || raw.date_from || raw.date_to);
  }

  clearFilters(): void {
    this.filtersForm.reset({ company: '', status: null, date_from: null, date_to: null });
  }

  goToPage(delta: number): void {
    const page = this.page();
    if (!page) return;
    const next = this.currentPage() + delta;
    if (next < 1 || next > page.pages) return;
    this.currentPage.set(next);
    this.load();
  }

  openCreateDialog(): void {
    this.dialog
      .open(ApplicationFormDialogComponent, { data: {}, width: '100%', maxWidth: '600px' })
      .afterClosed()
      .subscribe((created?: Application) => {
        if (!created) return;
        this.currentPage.set(1);
        this.load();
      });
  }

  openEditDialog(application: Application, event: Event): void {
    event.stopPropagation();
    this.dialog
      .open(ApplicationFormDialogComponent, { data: { application }, width: '100%', maxWidth: '600px' })
      .afterClosed()
      .subscribe((updated?: Application) => {
        if (!updated) return;
        this.load();
      });
  }

  deleteApplication(application: Application, event: Event): void {
    event.stopPropagation();
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
          next: () => this.load(),
          error: () => this.translate.get('common.error_generic').subscribe((msg) => this.snackBar.open(msg, undefined, { duration: 4000 })),
        });
      });
  }

  viewDetail(application: Application): void {
    this.router.navigate(['/applications', application.id]);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
