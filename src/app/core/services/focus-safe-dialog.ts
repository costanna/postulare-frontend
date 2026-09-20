import { ComponentType } from '@angular/cdk/portal';
import { Injectable, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

/**
 * MatDialog que suelta el foco del botón que lo abre ANTES de abrirse. Al abrir, Material marca toda la app como
 * aria-hidden y solo después mueve el foco al diálogo: en ese instante el botón seguía enfocado y el navegador
 * avisa ("Blocked aria-hidden on an element because its descendant retained focus"). El foco se devuelve al
 * botón al cerrar, como hace Material por defecto.
 */
@Injectable({ providedIn: 'root' })
export class FocusSafeMatDialog extends MatDialog {
  override open<T, D = unknown, R = unknown>(component: ComponentType<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R>;
  override open<T, D = unknown, R = unknown>(template: TemplateRef<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R>;
  override open<T, D = unknown, R = unknown>(
    target: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<D>
  ): MatDialogRef<T, R> {
    const active = document.activeElement;
    const trigger = active instanceof HTMLElement && active !== document.body ? active : null;
    trigger?.blur();

    const ref = super.open<T, D, R>(target as ComponentType<T>, { ...config, restoreFocus: false });
    if (trigger) {
      ref.afterClosed().subscribe(() => {
        if (trigger.isConnected) trigger.focus();
      });
    }
    return ref;
  }
}
