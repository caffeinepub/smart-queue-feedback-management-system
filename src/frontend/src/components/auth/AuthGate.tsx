import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { identity, login, isLoggingIn, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto mb-4">
              <img 
                src="/assets/generated/sqfm-logo.dim_256x256.png" 
                alt="SQFM Logo" 
                className="h-20 w-20 mx-auto"
              />
            </div>
            <CardTitle className="text-2xl">Welcome to Smart Queue</CardTitle>
            <CardDescription className="text-base">
              Please log in to access the queue management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={login} 
              disabled={isLoggingIn}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Log In
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
