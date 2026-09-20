import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, of, switchMap } from 'rxjs';

import {
  ApplyConfirmDialogComponent,
  ApplyConfirmDialogData,
} from '../../shared/ui/apply-confirm-dialog/apply-confirm-dialog.component';
import { Application } from '../models/application.model';
import { todayIso } from '../utils/iso-date';
import { ApplicationsService } from './applications.service';

/**
 * "Aplicar" a una oferta: se abre su página, la oferta queda guardada como candidatura y se pregunta si ya se
 * ha enviado; solo si la respuesta es sí pasa a "aplicada" (con la fecha de hoy).
 */
@Injectable({ providedIn: 'root' })
export class ApplyFlowService {
  private readonly dialog = inject(MatDialog);
  private readonly applications = inject(ApplicationsService);

  /** Abre la oferta en otra pestaña. Debe llamarse directamente desde el clic (si no, el navegador la bloquea).
   * Devuelve false si el navegador la bloqueó; sin URL no hay nada que abrir. */
  openOffer(url: string | null): boolean {
    if (!url) return true;
    const tab = window.open(url, '_blank');
    if (!tab) return false;
    tab.opener = null;
    return true;
  }

  /** Pregunta si ya se aplicó. Devuelve la candidatura actualizada, o null si no (todavía) o no se pudo. */
  confirmApplied(application: Application): Observable<Application | null> {
    const data: ApplyConfirmDialogData = { position: application.position, company: application.company_name };
    return this.dialog
      .open<ApplyConfirmDialogComponent, ApplyConfirmDialogData, boolean>(ApplyConfirmDialogComponent, {
        data,
        width: '90%',
        maxWidth: '440px',
      })
      .afterClosed()
      .pipe(
        switchMap((applied) =>
          applied
            ? this.applications.update(application.id, { status: 'applied', applied_at: todayIso() })
            : of(null)
        ),
        map((updated) => updated ?? null)
      );
  }
}
