import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTranslateService } from '@ngx-translate/core';

import { ApplyConfirmDialogComponent } from './apply-confirm-dialog.component';

describe('ApplyConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ApplyConfirmDialogComponent>;
  const dialogRef = { close: jasmine.createSpy('close') };

  beforeEach(async () => {
    dialogRef.close.calls.reset();
    await TestBed.configureTestingModule({
      imports: [ApplyConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService({ lang: 'es', fallbackLang: 'es' }),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { position: 'Dev', company: 'Acme' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplyConfirmDialogComponent);
    fixture.detectChanges();
  });

  const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('button'));

  it('shows a "not yet" and a "yes" answer', () => {
    expect(buttons().length).toBe(2);
  });

  it('"yes" closes with true', () => {
    buttons()[1].click();
    expect(dialogRef.close).toHaveBeenCalledOnceWith(true);
  });

  it('"not yet" closes with false', () => {
    buttons()[0].click();
    expect(dialogRef.close).toHaveBeenCalledOnceWith(false);
  });
});
