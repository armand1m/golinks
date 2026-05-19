import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { ThemeMode, persistThemeMode } from '../lib/theme';

interface Props {
  initialThemeMode: ThemeMode;
}

export const ThemeModeController: React.FC<Props> = ({
  initialThemeMode,
}) => {
  const { theme, setTheme } = useTheme();
  const hasSyncedInitialMode = useRef(false);

  useEffect(() => {
    if (!hasSyncedInitialMode.current) {
      hasSyncedInitialMode.current = true;
      if (theme !== initialThemeMode) {
        setTheme(initialThemeMode);
        return;
      }
    }
    if (theme === 'light' || theme === 'dark') {
      persistThemeMode(theme as ThemeMode);
    }
  }, [theme, initialThemeMode, setTheme]);

  return null;
};
