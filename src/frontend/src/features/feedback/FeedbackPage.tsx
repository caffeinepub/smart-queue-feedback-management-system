import { useState } from 'react';
import { useListServices, useSubmitFeedback } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Star, Send, CheckCircle2 } from 'lucide-react';

export default function FeedbackPage() {
  const [selectedServiceId, setSelectedServiceId] = useState<bigint | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: services, isLoading: servicesLoading } = useListServices();
  const submitFeedback = useSubmitFeedback();

  const selectedService = services?.find(s => s.id === selectedServiceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedServiceId) {
      toast.error('Please select a service');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        serviceId: selectedServiceId,
        rating: BigInt(rating),
        comment: comment.trim(),
      });

      setShowSuccess(true);
      setRating(0);
      setComment('');
      setSelectedServiceId(null);
      toast.success('Thank you for your feedback!');

      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      const message = error.message || 'Failed to submit feedback';
      if (message.includes('Invalid rating')) {
        toast.error('Please select a rating between 1 and 5');
      } else {
        toast.error(message);
      }
    }
  };

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Share Your Feedback</h1>
        <p className="text-muted-foreground">
          Help us improve by rating your experience and leaving a comment
        </p>
      </div>

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Your feedback has been submitted successfully! Thank you for helping us improve.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Feedback Form</CardTitle>
          <CardDescription>Select a service and share your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={selectedServiceId?.toString() || ''}
                onValueChange={(value) => setSelectedServiceId(BigInt(value))}
              >
                <SelectTrigger id="service">
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
                <p className="text-sm text-muted-foreground">{selectedService.description}</p>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating (Required)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  You rated: {rating} star{rating !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Tell us about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {comment.length} characters
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitFeedback.isPending || !selectedServiceId || rating === 0}
              className="w-full"
              size="lg"
            >
              {submitFeedback.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-accent/10 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Your feedback helps services improve their quality and customer experience. All feedback is reviewed by service administrators.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
