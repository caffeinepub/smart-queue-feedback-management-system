import { useState } from 'react';
import { useIsCallerAdmin, useListServices, useGetQueueSnapshot, useServeNext, useMarkNoShow, useGetServiceFeedback } from '../../hooks/useQueries';
import AccessDeniedScreen from '../../components/auth/AccessDeniedScreen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Shield, Users, MessageSquare, UserCheck, UserX, Star, RefreshCw } from 'lucide-react';
import type { QueueEntry } from '../../backend';

export default function AdminPage() {
  const [selectedServiceId, setSelectedServiceId] = useState<bigint | null>(null);

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: services, isLoading: servicesLoading } = useListServices();
  const { data: queueSnapshot, isLoading: queueLoading, refetch: refetchQueue } = useGetQueueSnapshot(selectedServiceId);
  const { data: feedbackList, isLoading: feedbackLoading, refetch: refetchFeedback } = useGetServiceFeedback(selectedServiceId);
  const serveNext = useServeNext();
  const markNoShow = useMarkNoShow();

  const selectedService = services?.find(s => s.id === selectedServiceId);

  const activeQueue = queueSnapshot?.filter(entry => entry.status === 'waiting') || [];
  const sortedFeedback = [...(feedbackList || [])].sort((a, b) => 
    Number(b.submittedAt - a.submittedAt)
  );

  const handleServeNext = async () => {
    if (!selectedServiceId) return;

    try {
      const userId = await serveNext.mutateAsync(selectedServiceId);
      toast.success(`Served customer: ${userId.toString().slice(0, 8)}...`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to serve next customer');
    }
  };

  const handleMarkNoShow = async (entry: QueueEntry) => {
    if (!selectedServiceId) return;

    try {
      await markNoShow.mutateAsync({ serviceId: selectedServiceId, userId: entry.userId });
      toast.success('Marked as no-show');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as no-show');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Waiting</Badge>;
      case 'served':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Served</Badge>;
      case 'noShow':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">No Show</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  if (adminLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage queues and review customer feedback
          </p>
        </div>
      </div>

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Service</CardTitle>
          <CardDescription>Choose a service to manage its queue and feedback</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedServiceId && selectedService && (
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queue">
              <Users className="mr-2 h-4 w-4" />
              Queue Management
            </TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback Review
            </TabsTrigger>
          </TabsList>

          {/* Queue Management Tab */}
          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Queue for {selectedService.name}</CardTitle>
                    <CardDescription>
                      {activeQueue.length} customer{activeQueue.length !== 1 ? 's' : ''} waiting
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetchQueue()}
                      disabled={queueLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      onClick={handleServeNext}
                      disabled={serveNext.isPending || activeQueue.length === 0}
                      size="sm"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Serve Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {queueLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading queue...</p>
                  </div>
                ) : queueSnapshot && queueSnapshot.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Joined At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueSnapshot.map((entry, index) => (
                        <TableRow key={entry.userId.toString()}>
                          <TableCell className="font-medium">
                            {entry.status === 'waiting' ? activeQueue.findIndex(e => e.userId.toString() === entry.userId.toString()) + 1 : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.userId.toString().slice(0, 12)}...
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(entry.joinedAt)}
                          </TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          <TableCell className="text-right">
                            {entry.status === 'waiting' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkNoShow(entry)}
                                disabled={markNoShow.isPending}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                No Show
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No entries in queue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Review Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Feedback for {selectedService.name}</CardTitle>
                    <CardDescription>
                      {sortedFeedback.length} feedback submission{sortedFeedback.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchFeedback()}
                    disabled={feedbackLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${feedbackLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading feedback...</p>
                  </div>
                ) : sortedFeedback.length > 0 ? (
                  <div className="space-y-4">
                    {sortedFeedback.map((feedback, index) => (
                      <Card key={index} className="border-l-4 border-l-primary/50">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= Number(feedback.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium">
                                {Number(feedback.rating)}/5
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(feedback.submittedAt)}
                            </span>
                          </div>
                          {feedback.comment && (
                            <p className="text-sm text-muted-foreground mb-2">
                              "{feedback.comment}"
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground font-mono">
                            Customer: {feedback.userId.toString().slice(0, 12)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback submitted yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedServiceId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select a Service</h3>
            <p className="text-muted-foreground max-w-md">
              Choose a service from the dropdown above to manage its queue and review customer feedback
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
