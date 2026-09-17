export const SUPPORTED_LANGUAGES = ['ca', 'es', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: AppLanguage = 'es';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  ca: 'Català',
  es: 'Castellano',
  en: 'English',
};

const STORAGE_KEY = 'postulare-lang';

function isSupported(value: string | null | undefined): value is AppLanguage {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Preferencia guardada > idioma del navegador > castellano (fallback). Se
 * calcula de forma síncrona porque hace falta antes de arrancar ngx-translate. */
export function resolveInitialLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    // localStorage no disponible (navegación privada, SSR, etc.)
  }

  const browserLang = (typeof navigator !== 'undefined' ? navigator.language : '').slice(0, 2).toLowerCase();
  return isSupported(browserLang) ? browserLang : FALLBACK_LANGUAGE;
}

export function persistLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // no crítico
  }
}
