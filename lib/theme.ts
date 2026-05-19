export type ThemeMode = 'light' | 'dark';
export type BumbagColorMode = 'default' | 'dark';

export const THEME_COOKIE_NAME = 'theme-mode';
export const LEGACY_COLOR_MODE_STORAGE_KEY = 'bb.mode';

const BODY_CLASS_PREFIX = 'bb-mode';
const DEFAULT_THEME_MODE: ThemeMode = 'light';
const DEFAULT_COLOR_MODE: BumbagColorMode = 'default';

export function toBumbagColorMode(
  themeMode: ThemeMode
): BumbagColorMode {
  return themeMode === 'dark' ? 'dark' : DEFAULT_COLOR_MODE;
}

export function fromBumbagColorMode(
  colorMode?: string | null
): ThemeMode {
  return colorMode === 'dark' ? 'dark' : DEFAULT_THEME_MODE;
}

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

export function applyColorModeBodyClass(
  colorMode: BumbagColorMode,
  body?: Pick<HTMLElement, 'classList'> | null
) {
  if (!body) {
    return;
  }

  body.classList.remove(
    `${BODY_CLASS_PREFIX}-${DEFAULT_COLOR_MODE}`,
    `${BODY_CLASS_PREFIX}-dark`
  );
  body.classList.add(`${BODY_CLASS_PREFIX}-${colorMode}`);
}

export function clearLegacyColorModeStorage(
  storage?: Pick<Storage, 'removeItem'> | null
) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(LEGACY_COLOR_MODE_STORAGE_KEY);
  } catch (_error) {
    return;
  }
}

export function persistThemeMode(
  themeMode: ThemeMode,
  documentRef: Document = document
) {
  documentRef.cookie = serializeThemeModeCookie(themeMode);
  applyColorModeBodyClass(
    toBumbagColorMode(themeMode),
    documentRef.body
  );
  clearLegacyColorModeStorage(documentRef.defaultView?.localStorage);
}

export function getColorModeInitializationScript() {
  return `(function() {
    try {
      var match = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=(dark|light)(?:;|$)/);
      var themeMode = match ? match[1] : '${DEFAULT_THEME_MODE}';
      var colorMode = themeMode === 'dark' ? 'dark' : '${DEFAULT_COLOR_MODE}';
      document.body.classList.remove('${BODY_CLASS_PREFIX}-${DEFAULT_COLOR_MODE}', '${BODY_CLASS_PREFIX}-dark');
      document.body.classList.add('${BODY_CLASS_PREFIX}-' + colorMode);
      try {
        window.localStorage.removeItem('${LEGACY_COLOR_MODE_STORAGE_KEY}');
      } catch (_error) {}
    } catch (_error) {}
  })();`;
}
