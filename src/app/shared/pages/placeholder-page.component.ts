import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Página temporal para las rutas todavía no implementadas (dashboard, kanban,
 * candidaturas, matches, perfil). Cada una se sustituirá por su propia
 * pantalla en su rama correspondiente; esto solo deja el routing navegable
 * de extremo a extremo mientras tanto. El título sale de `route.data.titleKey`.
 */
@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="placeholder-page">
      <h1>{{ titleKey() | translate }}</h1>
      <p>{{ 'common.coming_soon' | translate }}</p>
    </div>
  `,
  styles: `
    .placeholder-page {
      padding: 2.5rem 0;
      text-align: center;
    }
    h1 {
      margin: 0 0 0.5rem;
      color: var(--color-text);
    }
    p {
      color: var(--color-text-muted);
    }
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly titleKey = signal<string>(this.route.snapshot.data['titleKey'] ?? '');
}
