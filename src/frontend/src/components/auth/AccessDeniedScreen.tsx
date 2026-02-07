import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function AccessDeniedScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this area. Admin privileges are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate({ to: '/' })}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
