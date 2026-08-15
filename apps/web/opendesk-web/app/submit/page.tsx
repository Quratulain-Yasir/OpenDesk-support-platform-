"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { publicApi } from "@/lib/public-api"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export default function SubmitTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>(
    []
  )
  const [selectedWorkspace, setSelectedWorkspace] = useState("")

  // Workspaces fetch karo (public endpoint)
  useEffect(() => {
    fetch(`${API_URL}/workspaces/public`)
      .then((r) => r.json())
      .then((data) => {
        setWorkspaces(data)
        if (data.length > 0) setSelectedWorkspace(data[0].id)
      })
      .catch(() => setWorkspaces([]))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)
    const body = {
      subject: form.get("subject") as string,
      description: form.get("description") as string,
      customerEmail: form.get("customerEmail") as string,
      customerName: form.get("customerName") as string,
      priority: (form.get("priority") as string) || "MEDIUM",
      workspaceId: selectedWorkspace, // ← YEH ADD KIYA
    }

    try {
      const res = await publicApi("/public/tickets", {
        method: "POST",
        body: JSON.stringify(body),
      })
      router.push(`/track/${res.publicToken}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Submit a Ticket</CardTitle>
          <p className="text-sm text-muted-foreground">
            No account needed. We will email you a tracking link.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Workspace Dropdown — NEW */}
            <div>
              <Label htmlFor="workspace">Workspace</Label>
              <Select
                value={selectedWorkspace}
                onValueChange={(value) => setSelectedWorkspace(value || '')}
              >
                <SelectTrigger id="workspace">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                required
                placeholder="Brief issue summary"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Describe your issue in detail..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Your Name</Label>
                <Input id="customerName" name="customerName" required />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-primary"
              disabled={loading || !selectedWorkspace}
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
