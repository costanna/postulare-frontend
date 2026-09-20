import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  LucideBriefcase,
  LucideGlobe,
  LucideKanban,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucideMoon,
  LucideFlaskConical,
  LucideSparkles,
  LucideSun,
  LucideUser,
} from '@lucide/angular';

import { AppLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../core/i18n/supported-languages';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppFooterComponent } from '../../shared/ui/app-footer/app-footer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    AppFooterComponent,
    LucideMenu,
    LucideLayoutDashboard,
    LucideKanban,
    LucideBriefcase,
    LucideSparkles,
    LucideFlaskConical,
    LucideGlobe,
    LucideSun,
    LucideMoon,
    LucideLogOut,
    LucideUser,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);

  /** Cuenta temporal de "Prueba la demo": se muestra un aviso y una salida hacia el registro. */
  readonly isDemo = computed(() => this.auth.currentUser()?.is_demo ?? false);

  readonly languages = SUPPORTED_LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;

  setLanguage(lang: AppLanguage): void {
    this.language.use(lang);
  }

  /** Sale de la demo (sus datos se descartan) y lleva a crear una cuenta real. */
  createRealAccount(): void {
    this.auth.logout();
    this.router.navigate(['/auth/register']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
