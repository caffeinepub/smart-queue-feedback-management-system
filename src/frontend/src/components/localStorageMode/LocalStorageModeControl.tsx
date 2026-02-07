import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocalStorageMode } from '../../features/localStorageMode/useLocalStorageMode';
import { resetAllLocalData } from '../../utils/sqfmLocalStorage';
import { toast } from 'sonner';
import { Database, Trash2, Info } from 'lucide-react';

export default function LocalStorageModeControl() {
  const { isEnabled, toggle } = useLocalStorageMode();

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all local queue and feedback data? This action cannot be undone.')) {
      try {
        resetAllLocalData();
        toast.success('Local data has been reset');
        window.location.reload();
      } catch (error) {
        toast.error('Failed to reset local data');
      }
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Local Storage Mode
        </CardTitle>
        <CardDescription>
          Use browser storage instead of backend for queue and feedback data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="local-mode" className="flex flex-col gap-1 cursor-pointer">
            <span className="font-medium">Enable Local Storage Mode</span>
            <span className="text-sm text-muted-foreground font-normal">
              {isEnabled ? 'Currently using browser storage' : 'Currently using backend canister'}
            </span>
          </Label>
          <Switch
            id="local-mode"
            checked={isEnabled}
            onCheckedChange={toggle}
          />
        </div>

        {isEnabled && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Local Storage Mode is active. Queue and feedback data is stored in your browser and will be lost if you clear browser data.
                Token numbers are assigned automatically per service.
              </AlertDescription>
            </Alert>

            <div className="pt-2 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Reset Local Data
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                To manually clear data, open browser DevTools → Application/Storage → Local Storage → 
                remove keys starting with "sqfm:". See{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">frontend/LOCAL_STORAGE_MODE.md</code>{' '}
                for details.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
