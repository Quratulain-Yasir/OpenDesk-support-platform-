"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Send } from "lucide-react"

interface LeadMessage {
  id: string
  content: string
  authorId: string | null
  author: { name: string } | null
  createdAt: string
}

interface LeadActivity {
  id: string
  action: string
  metadata: Record<string, any>
  actor: { name: string } | null
  createdAt: string
}

interface LeadDetail {
  id: string
  data: Record<string, any>
  status: string
  createdAt: string
  form: { name: string; fields: { id: string; label: string }[] }
  messages: LeadMessage[]
  activities: LeadActivity[]
}

const STATUS_OPTIONS = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
]

interface Props {
  leadId: string | null
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChanged?: (leadId: string, newStatus: string) => void
}

export function LeadDrawer({ leadId, workspaceId, open, onOpenChange, onStatusChanged }: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [sending, setSending] = useState(false)

  const loadLead = useCallback(async () => {
    if (!leadId || !workspaceId) return
    setLoading(true)
    try {
      const data = await api(`/workspaces/${workspaceId}/leads/${leadId}`)
      setLead(data)
    } catch {
      setLead(null)
    } finally {
      setLoading(false)
    }
  }, [leadId, workspaceId])

  useEffect(() => {
    if (open && leadId) {
      loadLead()
    }
  }, [open, leadId, loadLead])

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return
    if (!lead || !workspaceId) return
    const prevStatus = lead.status
    setLead({ ...lead, status: newStatus })
    try {
      await api(`/workspaces/${workspaceId}/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      onStatusChanged?.(lead.id, newStatus)
      loadLead()
    } catch {
      alert("Failed to update status")
      setLead({ ...lead, status: prevStatus })
    }
  }

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim() || !lead || !workspaceId) return
    setSending(true)
    try {
      await api(`/workspaces/${workspaceId}/leads/${lead.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: comment }),
      })
      setComment("")
      await loadLead()
    } catch {
      alert("Failed to add comment")
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* ─── FIX: bg-card + border-l + p-6 ─── */}
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-l p-6">
        {loading || !lead ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            <SheetHeader>
              <SheetTitle>Lead Details</SheetTitle>
            </SheetHeader>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Form data */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Submitted via: {lead.form.name}
              </h3>
              <div className="border divide-y">
                {Object.entries(lead.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Received: {new Date(lead.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Comments</h3>
              <div className="space-y-2 mb-3">
                {lead.messages.length === 0 && (
                  <p className="text-xs text-muted-foreground">No comments yet.</p>
                )}
                {lead.messages.map((msg) => (
                  <div key={msg.id} className="border bg-muted/30 p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold">
                        {msg.author?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendComment} className="space-y-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={sending} className="gap-2">
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending..." : "Comment"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Activity */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Activity</h3>
              {lead.activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {lead.activities.map((act) => (
                    <div key={act.id} className="text-xs border-l-2 border-muted pl-3 py-1">
                      <p className="font-medium capitalize">
                        {act.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-muted-foreground">
                        {act.actor?.name || "System"} ·{" "}
                        {new Date(act.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}