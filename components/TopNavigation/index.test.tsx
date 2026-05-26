import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { ThemeModeController } from '../ThemeModeController';
import { TopNavigation } from '.';
import { ThemeMode } from '../../lib/theme';

function clearThemeCookie() {
  document.cookie =
    'theme-mode=; Path=/; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function renderNavigation(initialThemeMode: ThemeMode) {
  return render(
    <ThemeProvider attribute="class" defaultTheme={initialThemeMode}>
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

describe('TopNavigation help link', () => {
  beforeEach(() => {
    clearThemeCookie();
    document.documentElement.className = '';
    window.localStorage.clear();
  });

  it('renders a help link pointing to /help', () => {
    renderNavigation('light');
    const helpLink = screen.getByRole('link', { name: 'Help' });
    expect(helpLink).toBeInTheDocument();
    expect(helpLink).toHaveAttribute('href', '/help');
  });
});

describe('TopNavigation theme toggle', () => {
  beforeEach(() => {
    clearThemeCookie();
    document.documentElement.className = '';
    window.localStorage.clear();
  });

  it('switches from light to dark and does not revert on rerender', async () => {
    const { rerender } = renderNavigation('light');

    await waitFor(() => {
      expect(
        document.documentElement.classList.contains('dark')
      ).toBe(false);
      expect(document.cookie).toContain('theme-mode=light');
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Switch to dark mode',
      })
    );

    await waitFor(() => {
      expect(
        document.documentElement.classList.contains('dark')
      ).toBe(true);
      expect(document.cookie).toContain('theme-mode=dark');
      expect(
        screen.getByRole('button', {
          name: 'Switch to light mode',
        })
      ).toBeInTheDocument();
    });

    rerender(
      <ThemeProvider attribute="class" defaultTheme="light">
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
      expect(
        document.documentElement.classList.contains('dark')
      ).toBe(true);
      expect(document.cookie).toContain('theme-mode=dark');
    });
  });
});
