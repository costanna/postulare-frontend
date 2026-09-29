import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ServerWakeService } from '../../../core/services/server-wake.service';

/** "Waking up the server…" notice, shown only while the free-tier API is starting up. */
@Component({
  selector: 'app-wake-banner',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (wake.waking()) {
      <div class="banner" role="status">
        <span class="banner__spinner" aria-hidden="true"></span>
        <p>{{ 'server.waking' | translate }}</p>
      </div>
    }
  `,
  styles: `
    .banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: var(--color-surface-hover);
      color: var(--color-text);
      font-size: 0.9375rem;
      text-align: center;
    }

    .banner__spinner {
      flex: none;
      width: 1rem;
      height: 1rem;
      border: 2px solid var(--color-accent);
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 800ms linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class WakeBannerComponent {
  protected readonly wake = inject(ServerWakeService);
}
