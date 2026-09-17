import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'postulare-theme';

/**
 * Alterna el tema claro/oscuro escribiendo el atributo [data-theme] en <body>.
 * Las variables CSS reales viven en styles.scss; este servicio solo decide
 * qué juego de variables aplica y persiste la preferencia en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(this.resolveInitialTheme());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.theme.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage puede no estar disponible (navegación privada); no es crítico.
    }
  }

  private apply(mode: ThemeMode): void {
    document.body.setAttribute('data-theme', mode);
  }

  private resolveInitialTheme(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // ignoramos y caemos al valor por defecto del sistema
    }

    const prefersDark = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
