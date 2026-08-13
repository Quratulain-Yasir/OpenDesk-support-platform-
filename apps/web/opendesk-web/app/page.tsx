import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Ticket, Users, BarChart3, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b px-6 py-4">
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
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight">
          Helpdesk that scales with your team
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Multi-tenant ticketing, real-time collaboration, and AI-powered
          responses — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start for Free
            </Button>
          </Link>
          <Link href="/submit">
            <Button variant="outline" size="lg">
              Submit a Ticket
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Ticket className="h-6 w-6" />}
            title="Smart Ticketing"
            desc="Kanban boards, priorities, and assignments."
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Team Collaboration"
            desc="Internal notes and @mentions."
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Analytics"
            desc="Response times and resolution rates."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
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
  )
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="border bg-card p-6">
      <div className="mb-4 text-accent">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
