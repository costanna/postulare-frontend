import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface ApplyConfirmDialogData {
  position: string;
  company: string;
}

/** "¿Ya has aplicado?" Devuelve true si sí; cerrarlo de cualquier otra forma equivale a "todavía no". */
@Component({
  selector: 'app-apply-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslatePipe],
  template: `
    <h2 mat-dialog-title>{{ 'apply_dialog.title' | translate }}</h2>
    <mat-dialog-content>
      {{ 'apply_dialog.message' | translate: { position: data.position, company: data.company } }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">{{ 'apply_dialog.no' | translate }}</button>
      <button mat-flat-button color="primary" type="button" (click)="dialogRef.close(true)">
        {{ 'apply_dialog.yes' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ApplyConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ApplyConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ApplyConfirmDialogData
  ) {}
}
