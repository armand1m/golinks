export type ThemeMode = 'light' | 'dark';

export const THEME_COOKIE_NAME = 'theme-mode';

const DEFAULT_THEME_MODE: ThemeMode = 'light';

export function readThemeModeCookie(rawCookie?: string): ThemeMode {
  if (!rawCookie) {
    return DEFAULT_THEME_MODE;
  }

  const cookieParts = rawCookie.split(';');

  for (const cookiePart of cookieParts) {
    const [rawName, ...rawValueParts] = cookiePart.trim().split('=');

    if (rawName !== THEME_COOKIE_NAME) {
      continue;
    }

    const rawValue = rawValueParts.join('=');
    const value = decodeURIComponent(rawValue);

    if (value === 'light' || value === 'dark') {
      return value;
    }
  }

  return DEFAULT_THEME_MODE;
}

export function serializeThemeModeCookie(
  themeMode: ThemeMode
): string {
  return `${THEME_COOKIE_NAME}=${encodeURIComponent(
    themeMode
  )}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function persistThemeMode(
  themeMode: ThemeMode,
  documentRef: Document = document
) {
  documentRef.cookie = serializeThemeModeCookie(themeMode);
}

export function getColorModeInitializationScript() {
  return `(function() {
    try {
      var match = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=(dark|light)(?:;|$)/);
      var themeMode = match ? match[1] : '${DEFAULT_THEME_MODE}';
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (_error) {}
  })();`;
}
