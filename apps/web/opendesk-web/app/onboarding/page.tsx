"use client"

import { useState, useEffect } from "react"
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
  const [token, setToken] = useState("")

  // Token check on mount
  useEffect(() => {
    const t = localStorage.getItem("accessToken") || ""
    if (!t) {
      router.push("/login")
      return
    }
    setToken(t)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      alert("Please login first")
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      const data = await api("/workspaces", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        }),
      })
      localStorage.setItem("workspaceId", data.id)
      router.push("/dashboard/tickets")
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        alert("Session expired. Please login again.")
        localStorage.removeItem("accessToken")
        router.push("/login")
      } else {
        alert("Failed to create workspace: " + (err.message || "Unknown error"))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <div className="p-12 text-center">Checking auth...</div>
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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug (unique)</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-inc"
                required
              />
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