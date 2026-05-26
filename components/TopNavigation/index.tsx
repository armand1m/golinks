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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          aria-label={`Switch to ${
            theme === 'dark' ? 'light' : 'dark'
          } mode`}
          variant="ghost"
          size="icon"
          onClick={() =>
            setTheme(theme === 'dark' ? 'light' : 'dark')
          }
          suppressHydrationWarning
        >
          {mounted ? (theme === 'dark' ? '☀️' : '🌙') : '🌙'}
        </Button>
        {isAuthEnabled && (
          <Button
            variant="link"
            onClick={() =>
              window.location.replace(
                isAuthenticated ? '/auth/logout' : '/auth/login'
              )
            }
          >
            {isAuthenticated ? (
              <LogOut className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {isAuthenticated ? 'Logout' : 'Login'}
          </Button>
        )}
      </div>
    </nav>
  );
};
