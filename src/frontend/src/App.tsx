import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import AppLayout from './components/layout/AppLayout';
import AuthGate from './components/auth/AuthGate';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import HomePage from './pages/HomePage';
import QueuePage from './features/queue/QueuePage';
import FeedbackPage from './features/feedback/FeedbackPage';
import AdminPage from './features/admin/AdminPage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

function Layout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const queueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/queue',
  component: QueuePage,
});

const feedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feedback',
  component: FeedbackPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([indexRoute, queueRoute, feedbackRoute, adminRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
      {showProfileSetup && <ProfileSetupDialog />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}
