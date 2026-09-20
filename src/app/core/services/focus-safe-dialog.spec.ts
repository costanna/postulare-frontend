import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FocusSafeMatDialog } from './focus-safe-dialog';

@Component({
  standalone: true,
  imports: [MatDialogModule],
  template: `<mat-dialog-content>hola</mat-dialog-content><button id="inside" (click)="ref.close()">ok</button>`,
})
class ProbeDialogComponent {
  constructor(public ref: MatDialogRef<ProbeDialogComponent>) {}
}

@Component({ standalone: true, template: `<button id="trigger">abrir</button>` })
class HostComponent {}

describe('FocusSafeMatDialog', () => {
  let fixture: ComponentFixture<HostComponent>;
  let dialog: MatDialog;
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [{ provide: MatDialog, useClass: FocusSafeMatDialog }],
    });
    fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    dialog = TestBed.inject(MatDialog);
    trigger = fixture.nativeElement.querySelector('#trigger');
    trigger.focus();
  });

  afterEach(() => fixture.nativeElement.remove());

  it('is what the app injects as MatDialog', () => {
    expect(dialog instanceof FocusSafeMatDialog).toBeTrue();
  });

  it('releases the focus of the button that opens the dialog before opening it', () => {
    const blur = spyOn(trigger, 'blur').and.callThrough();
    expect(document.activeElement).toBe(trigger);

    dialog.open(ProbeDialogComponent);

    expect(blur).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(trigger);
  });

  it('gives the focus back to the button when the dialog closes', fakeAsync(() => {
    const ref = dialog.open(ProbeDialogComponent);
    ref.close();
    flush();

    expect(document.activeElement).toBe(trigger);
  }));

  it('does not try to restore focus to a button that no longer exists', fakeAsync(() => {
    const ref = dialog.open(ProbeDialogComponent);
    trigger.remove();
    ref.close();
    flush();

    expect(document.activeElement).not.toBe(trigger);
  }));

  it('opens dialogs normally when nothing is focused', fakeAsync(() => {
    (document.activeElement as HTMLElement).blur();
    const ref = dialog.open(ProbeDialogComponent);
    expect(ref.componentInstance instanceof ProbeDialogComponent).toBeTrue();
    ref.close();
    flush();
  }));
});
