import { useState, useEffect } from 'react';
import { useListServices, useJoinQueue, useLeaveQueue, useGetQueueStatus } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, RefreshCw, LogOut, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function QueuePage() {
  const [selectedServiceId, setSelectedServiceId] = useState<bigint | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);

  const { data: services, isLoading: servicesLoading } = useListServices();
  const joinQueue = useJoinQueue();
  const leaveQueue = useLeaveQueue();
  const { data: queuePosition, isLoading: statusLoading, refetch: refetchStatus } = useGetQueueStatus(
    selectedServiceId,
    isInQueue
  );

  const selectedService = services?.find(s => s.id === selectedServiceId);

  const handleJoinQueue = async () => {
    if (!selectedServiceId) {
      toast.error('Please select a service first');
      return;
    }

    try {
      await joinQueue.mutateAsync(selectedServiceId);
      setIsInQueue(true);
      toast.success('Successfully joined the queue!');
    } catch (error: any) {
      const message = error.message || 'Failed to join queue';
      if (message.includes('Already in queue')) {
        setIsInQueue(true);
        toast.info('You are already in this queue');
      } else {
        toast.error(message);
      }
    }
  };

  const handleLeaveQueue = async () => {
    if (!selectedServiceId) return;

    try {
      await leaveQueue.mutateAsync(selectedServiceId);
      setIsInQueue(false);
      toast.success('You have left the queue');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave queue');
    }
  };

  const handleManualRefresh = () => {
    refetchStatus();
    toast.success('Queue status refreshed');
  };

  useEffect(() => {
    if (selectedServiceId) {
      setIsInQueue(false);
    }
  }, [selectedServiceId]);

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
        <p className="text-muted-foreground">
          Select a service, join the queue, and track your position in real-time
        </p>
      </div>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Service</CardTitle>
          <CardDescription>Choose the service you want to join</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedServiceId?.toString() || ''}
            onValueChange={(value) => setSelectedServiceId(BigInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent>
              {services?.map((service) => (
                <SelectItem key={service.id.toString()} value={service.id.toString()}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedService && (
            <Alert>
              <AlertDescription>
                <strong>{selectedService.name}</strong>
                <br />
                {selectedService.description}
              </AlertDescription>
            </Alert>
          )}

          {selectedServiceId && !isInQueue && (
            <Button
              onClick={handleJoinQueue}
              disabled={joinQueue.isPending}
              className="w-full"
              size="lg"
            >
              {joinQueue.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Join Queue
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Queue Status */}
      {isInQueue && selectedServiceId && (
        <Card className="border-2 border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Your Queue Status
                </CardTitle>
                <CardDescription>Live updates every 7 seconds</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={statusLoading}
              >
                <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
                <span className="text-4xl font-bold text-primary">
                  {queuePosition ? Number(queuePosition) : '...'}
                </span>
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                {queuePosition && Number(queuePosition) === 1 ? "You're Next!" : 'Your Position'}
              </h3>
              <p className="text-muted-foreground">
                {queuePosition && Number(queuePosition) === 1
                  ? 'Please be ready, you will be served soon'
                  : 'in the queue'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-sm py-1 px-3">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Waiting
              </Badge>
            </div>

            <Button
              onClick={handleLeaveQueue}
              disabled={leaveQueue.isPending}
              variant="destructive"
              className="w-full"
            >
              {leaveQueue.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Queue
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isInQueue && !selectedServiceId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <img 
              src="/assets/generated/sqfm-empty-state.dim_512x512.png" 
              alt="No active queue" 
              className="h-48 w-48 mb-6 opacity-50"
            />
            <h3 className="text-xl font-semibold mb-2">No Active Queue</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Select a service above and join the queue to start tracking your position
            </p>
            <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
