import { useEffect, useRef } from 'react';
import { useColorMode } from 'bumbag';
import {
  ThemeMode,
  fromBumbagColorMode,
  persistThemeMode,
  toBumbagColorMode,
} from '../lib/theme';

interface Props {
  initialThemeMode: ThemeMode;
}

export const ThemeModeController: React.FC<Props> = ({
  initialThemeMode,
}) => {
  const { colorMode, setColorMode } = useColorMode();
  const hasSyncedInitialMode = useRef(false);
  const initialColorMode = toBumbagColorMode(initialThemeMode);

  useEffect(() => {
    if (!hasSyncedInitialMode.current) {
      hasSyncedInitialMode.current = true;

      if (colorMode !== initialColorMode) {
        setColorMode(initialColorMode);
        return;
      }
    }

    persistThemeMode(fromBumbagColorMode(colorMode));
  }, [colorMode, initialColorMode, setColorMode]);

  return null;
};
