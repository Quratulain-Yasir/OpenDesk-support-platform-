"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Member {
  id: string
  role: string
  user: { id: string; name: string; email: string }
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [myRole, setMyRole] = useState("")
  const [wsId, setWsId] = useState("")

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("AGENT")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState("")

  useEffect(() => {
    const id = localStorage.getItem("workspaceId") || ""
    setWsId(id)
    if (id) loadTeam(id)
  }, [])

  async function loadTeam(id: string) {
    try {
      const data = await api(`/workspaces/${id}/team`)
      setMembers(data)
      const token = localStorage.getItem("accessToken")
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const myId = payload.sub || payload.userId
        const me = data.find((m: Member) => m.user.id === myId)
        if (me) setMyRole(me.role)
      }
    } catch {
      setMembers([])
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    setInviteLoading(true)
    setInviteMsg("")
    try {
      const res = await api(`/workspaces/${wsId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      setInviteMsg(`Invite sent! Link: ${res.acceptLink}`)
      setInviteEmail("")
    } catch (err: any) {
      setInviteMsg(err.message || "Failed to send invite")
    } finally {
      setInviteLoading(false)
    }
  }

  async function changeRole(mId: string, role: string) {
    try {
      await api(`/workspaces/${wsId}/team/${mId}`, { method: "PATCH", body: JSON.stringify({ role }) })
      loadTeam(wsId)
    } catch {
      alert("Failed to update role")
    }
  }

  async function removeMember(mId: string) {
    if (!confirm("Remove this member?")) return
    try {
      await api(`/workspaces/${wsId}/team/${mId}`, { method: "DELETE" })
      loadTeam(wsId)
    } catch {
      alert("Failed to remove")
    }
  }

  const canManage = myRole === "OWNER" || myRole === "ADMIN"

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Team</h1>

      {/* Invite Member Form — Only for Owner/Admin */}
      {canManage && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                type="email"
                required
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value || 'AGENT')}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={inviteLoading} size="sm">
                {inviteLoading ? "Sending..." : "Invite"}
              </Button>
            </form>
            {inviteMsg && (
              <p className="mt-2 text-xs text-green-600 break-all">{inviteMsg}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {members.length === 0 && <p className="text-muted-foreground">No members found.</p>}
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{m.user.name || m.user.email}</p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>{m.role}</Badge>
                {canManage && m.role !== "OWNER" && (
                  <>
                    <Select defaultValue={m.role} onValueChange={(v) => v && changeRole(m.id, v)}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="AGENT">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeMember(m.id)}>
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
