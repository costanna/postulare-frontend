import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <footer class="app-footer">
      <span>&copy; {{ year }} Postulare</span>
      <span class="app-footer__sep" aria-hidden="true">&middot;</span>
      <span>
        {{ 'footer.made_by' | translate }}
        <a href="https://github.com/costanna" target="_blank" rel="noopener noreferrer">&#64;costanna</a>
      </span>
    </footer>
  `,
  styles: `
    .app-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.35rem 0.6rem;
      padding: 1rem;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }
    .app-footer a {
      color: var(--color-accent);
      font-weight: 600;
      text-decoration: none;
    }
    .app-footer a:hover {
      text-decoration: underline;
    }
  `,
})
export class AppFooterComponent {
  readonly year = new Date().getFullYear();
}
