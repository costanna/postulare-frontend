import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ServerWakeService } from './core/services/server-wake.service';
import { ThemeService } from './core/services/theme.service';
import { WakeBannerComponent } from './shared/ui/wake-banner/wake-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WakeBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  // Se inyecta solo para que el constructor de ThemeService se ejecute cuanto
  // antes y fije [data-theme] en <body> antes del primer render visible.
  private readonly theme = inject(ThemeService);
  private readonly wake = inject(ServerWakeService);

  constructor() {
    // No bloquea el primer render: el backend gratuito puede tardar casi un
    // minuto en despertar, así que solo mostramos el aviso si tarda de verdad.
    this.wake.start();
  }
}
