"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")

  // NEW — step control
  const [step, setStep] = useState<"workspace" | "invite">("workspace")
  const [workspaceId, setWorkspaceId] = useState("")

  // NEW — invite form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("AGENT")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState("")

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
      setWorkspaceId(data.id)
      setStep("invite") // NEW — workspace ke baad invite step dikhao
    } catch (err: any) {
      if (
        err.message?.includes("401") ||
        err.message?.includes("Unauthorized")
      ) {
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

  // NEW — invite handler
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return
    setInviteLoading(true)
    setInviteMsg("")
    try {
      await api(`/workspaces/${workspaceId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      setInviteMsg(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
    } catch (err: any) {
      setInviteMsg(err.message || "Failed to send invite")
    } finally {
      setInviteLoading(false)
    }
  }

  if (!token) {
    return <div className="p-12 text-center">Checking auth...</div>
  }

  // NEW — Step 2: Invite teammates or skip
  if (step === "invite") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invite Your Team</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Add teammates now, or skip and invite them later from Settings.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  type="email"
                  placeholder="teammate@company.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => v && setInviteRole(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteMsg && (
                <p className="text-xs break-all text-green-600">{inviteMsg}</p>
              )}
              <Button type="submit" className="w-full" disabled={inviteLoading}>
                {inviteLoading ? "Sending..." : "Send Invite"}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => router.push("/dashboard/tickets")}
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 1: Create workspace
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
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
