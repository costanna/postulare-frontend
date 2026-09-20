import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { LucideCircleAlert, LucideSparkles } from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

/**
 * "Prueba la demo": crea en el backend una cuenta temporal con datos de ejemplo
 * y entra directamente, sin registro. Los datos de la demo se generan en el
 * idioma que tenga la interfaz en ese momento.
 */
@Component({
  selector: 'app-demo-button',
  standalone: true,
  imports: [TranslatePipe, MatButtonModule, MatProgressSpinnerModule, LucideSparkles, LucideCircleAlert],
  templateUrl: './demo-button.component.html',
  styleUrl: './demo-button.component.scss',
})
export class DemoButtonComponent {
  private readonly auth = inject(AuthService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  start(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.startDemo(this.language.current()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 429
            ? 'auth.error_too_many_requests'
            : err.status === 503
              ? 'auth.demo.error_unavailable'
              : 'common.error_generic'
        );
      },
    });
  }
}
