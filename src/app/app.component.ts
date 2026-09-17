import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // Se inyecta solo para que el constructor de ThemeService se ejecute cuanto
  // antes y fije [data-theme] en <body> antes del primer render visible.
  private readonly theme = inject(ThemeService);
}
