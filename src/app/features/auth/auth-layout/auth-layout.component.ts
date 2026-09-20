import { Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideGlobe, LucideMoon, LucideSun } from '@lucide/angular';

import { AppLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../../../core/i18n/supported-languages';
import { LanguageService } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AppFooterComponent } from '../../../shared/ui/app-footer/app-footer.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, TranslatePipe, MatMenuModule, LucideGlobe, LucideSun, LucideMoon, AppFooterComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly theme = inject(ThemeService);
  readonly language = inject(LanguageService);

  readonly languages = SUPPORTED_LANGUAGES;
  readonly languageLabels = LANGUAGE_LABELS;

  setLanguage(lang: AppLanguage): void {
    this.language.use(lang);
  }
}
