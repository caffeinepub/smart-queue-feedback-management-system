import { Link, useRouterState } from '@tanstack/react-router';
import LoginButton from '../auth/LoginButton';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Shield } from 'lucide-react';
import { SiCoffeescript } from 'react-icons/si';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img 
                src="/assets/generated/sqfm-logo.dim_256x256.png" 
                alt="SQFM Logo" 
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight">Smart Queue</h1>
                <p className="text-xs text-muted-foreground">Feedback Management</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Button
                asChild
                variant={isActive('/queue') ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/queue">
                  <Users className="mr-2 h-4 w-4" />
                  Queue
                </Link>
              </Button>
              <Button
                asChild
                variant={isActive('/feedback') ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/feedback">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Feedback
                </Link>
              </Button>
              <Button
                asChild
                variant={isActive('/admin') ? 'default' : 'ghost'}
                size="sm"
              >
                <Link to="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </Link>
              </Button>
            </nav>

            <div className="flex items-center gap-2">
              <LoginButton />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-2 mt-4 border-t pt-3">
            <Button
              asChild
              variant={isActive('/queue') ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
            >
              <Link to="/queue">
                <Users className="mr-2 h-4 w-4" />
                Queue
              </Link>
            </Button>
            <Button
              asChild
              variant={isActive('/feedback') ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
            >
              <Link to="/feedback">
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback
              </Link>
            </Button>
            <Button
              asChild
              variant={isActive('/admin') ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
            >
              <Link to="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © 2026. Built with <SiCoffeescript className="inline h-4 w-4 text-primary" /> using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
