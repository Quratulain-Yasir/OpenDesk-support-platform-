import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ticket, Users, BarChart3, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight">OpenDesk</div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Helpdesk that scales with your team
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Multi-tenant ticketing, real-time collaboration, and AI-powered responses — all in one place.
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start for Free
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Ticket className="w-6 h-6" />}
            title="Smart Ticketing"
            desc="Kanban boards, priorities, and assignments."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Team Collaboration"
            desc="Internal notes and @mentions."
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Analytics"
            desc="Response times and resolution rates."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Secure"
            desc="Role-based access and audit logs."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        © 2026 OpenDesk. Built for teams.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 border bg-card">
      <div className="mb-4 text-accent">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}