import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { RELOAD_GUARD_KEY } from './core/error-handling/chunk-error-handler';
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
    // Si llegamos aquí es que el bundle actual ha cargado bien: si más
    // adelante vuelve a fallar un chunk (nuevo deploy, no este mismo error
    // persistiendo), ChunkErrorHandler debe poder intentar recargar de nuevo.
    sessionStorage.removeItem(RELOAD_GUARD_KEY);

    // No bloquea el primer render: el backend gratuito puede tardar casi un
    // minuto en despertar, así que solo mostramos el aviso si tarda de verdad.
    this.wake.start();
  }
}
