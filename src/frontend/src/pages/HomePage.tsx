import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, Shield, Clock, Star, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="max-w-4xl mx-auto">
          <img 
            src="/assets/generated/sqfm-hero.dim_1200x600.png" 
            alt="Smart Queue Hero" 
            className="w-full rounded-2xl shadow-2xl mb-8"
          />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome to Smart Queue
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Manage queues efficiently and collect valuable feedback. Join a service queue, track your position in real-time, and share your experience.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link to="/queue">
                <Users className="mr-2 h-5 w-5" />
                Join Queue
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8">
              <Link to="/feedback">
                <MessageSquare className="mr-2 h-5 w-5" />
                Give Feedback
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Real-Time Updates</CardTitle>
            <CardDescription>
              Track your queue position with live updates every few seconds. Know exactly when it's your turn.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Easy Feedback</CardTitle>
            <CardDescription>
              Share your experience with simple ratings and comments. Help services improve their quality.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Manage queues efficiently with admin tools. Serve customers, handle no-shows, and review feedback.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* How It Works */}
      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</span>
                Select a Service
              </CardTitle>
              <CardDescription>
                Choose from available services and join their queue with a single click.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</span>
                Track Your Position
              </CardTitle>
              <CardDescription>
                Monitor your queue position in real-time. Get notified when you're next in line.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</span>
                Share Feedback
              </CardTitle>
              <CardDescription>
                After your service, rate your experience and leave comments to help improve quality.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12 bg-accent/10 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Join a queue now or explore the admin dashboard to manage your services.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/queue">
              <Users className="mr-2 h-5 w-5" />
              Join Queue Now
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/admin">
              <Shield className="mr-2 h-5 w-5" />
              Admin Dashboard
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
