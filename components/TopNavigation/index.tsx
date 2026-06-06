import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { HelpCircle, LogIn, LogOut } from 'lucide-react';

interface Props {
  baseUrl: string;
  logoname: string;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
}

export const TopNavigation: React.FC<Props> = ({
  baseUrl,
  logoname,
  isAuthenticated,
  isAuthEnabled,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <div>
        <a href={baseUrl} className="font-semibold">
          <h3 className="text-lg font-semibold">{logoname}</h3>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <a href="/help" aria-label="Help">
            <HelpCircle className="h-5 w-5" />
          </a>
        </Button>
        <Button
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          suppressHydrationWarning>
          {mounted ? (isDark ? '☀️' : '🌙') : '🌙'}
        </Button>
        {isAuthEnabled && (
          <Button variant="link" asChild>
            <a
              href={isAuthenticated ? '/auth/logout' : '/auth/login'}>
              {isAuthenticated ? (
                <LogOut className="mr-2 h-4 w-4" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isAuthenticated ? 'Logout' : 'Login'}
            </a>
          </Button>
        )}
      </div>
    </nav>
  );
};
