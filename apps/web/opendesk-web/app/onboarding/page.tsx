"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-') }),
      })
      localStorage.setItem("workspaceId", data.id)
      router.push("/dashboard/tickets")
    } catch {
      alert("Failed to create workspace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Your Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc" required />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-inc" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}