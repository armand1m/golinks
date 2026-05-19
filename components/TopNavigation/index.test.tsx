import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Provider as ThemeProvider, ThemeConfig } from 'bumbag';
import { ThemeModeController } from '../ThemeModeController';
import { TopNavigation } from '.';
import { ThemeMode, toBumbagColorMode } from '../../lib/theme';

const theme: ThemeConfig = {
  modes: {
    enableLocalStorage: false,
    useSystemColorMode: false,
  },
};

function clearThemeCookie() {
  document.cookie =
    'theme-mode=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function renderNavigation(initialThemeMode: ThemeMode) {
  return render(
    <ThemeProvider
      colorMode={toBumbagColorMode(initialThemeMode)}
      theme={theme}
    >
      <ThemeModeController initialThemeMode={initialThemeMode} />
      <TopNavigation
        baseUrl="https://go.example.com"
        isAuthenticated={false}
        isAuthEnabled={false}
        logoname="Go Links"
      />
    </ThemeProvider>
  );
}

describe('TopNavigation theme toggle', () => {
  beforeEach(() => {
    clearThemeCookie();
    document.body.className = '';
    window.localStorage.clear();
  });

  it('switches from light to dark and does not revert on rerender', async () => {
    window.localStorage.setItem('bb.mode', 'dark');

    const { rerender } = renderNavigation('light');

    await waitFor(() => {
      expect(document.body).toHaveClass('bb-mode-default');
      expect(document.cookie).toContain('theme-mode=light');
    });

    expect(window.localStorage.getItem('bb.mode')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Switch to dark mode',
      })
    );

    await waitFor(() => {
      expect(document.body).toHaveClass('bb-mode-dark');
      expect(document.cookie).toContain('theme-mode=dark');
      expect(
        screen.getByRole('button', {
          name: 'Switch to light mode',
        })
      ).toBeInTheDocument();
    });

    rerender(
      <ThemeProvider colorMode="default" theme={theme}>
        <ThemeModeController initialThemeMode="light" />
        <TopNavigation
          baseUrl="https://go.example.com"
          isAuthenticated={false}
          isAuthEnabled={false}
          logoname="Go Links"
        />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(document.body).toHaveClass('bb-mode-dark');
      expect(document.cookie).toContain('theme-mode=dark');
    });

    expect(window.localStorage.getItem('bb.mode')).toBeNull();
  });
});
