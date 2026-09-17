import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ApplicationStatus } from '../../../core/models/application.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [TranslatePipe],
  template: `<span class="status-badge" [class]="'status-badge--' + status()">{{
    'status.' + status() | translate
  }}</span>`,
  styles: `
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      line-height: 1.6;
    }
    .status-badge--saved {
      background: var(--color-status-saved-bg);
      color: var(--color-status-saved-fg);
    }
    .status-badge--applied {
      background: var(--color-status-applied-bg);
      color: var(--color-status-applied-fg);
    }
    .status-badge--interview {
      background: var(--color-status-interview-bg);
      color: var(--color-status-interview-fg);
    }
    .status-badge--offer {
      background: var(--color-status-offer-bg);
      color: var(--color-status-offer-fg);
    }
    .status-badge--rejected {
      background: var(--color-status-rejected-bg);
      color: var(--color-status-rejected-fg);
    }
    .status-badge--withdrawn {
      background: var(--color-status-withdrawn-bg);
      color: var(--color-status-withdrawn-fg);
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<ApplicationStatus>();
}
