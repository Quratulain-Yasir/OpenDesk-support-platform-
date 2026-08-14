"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Send } from "lucide-react"

interface Message {
  id: string
  content: string
  isInternal: boolean
  authorId: string | null
  authorName: string | null
  author: { name: string } | null
  createdAt: string
}

interface Activity {
  id: string
  action: string
  metadata: Record<string, any>
  actor: { name: string } | null
  createdAt: string
}

interface SavedResponse {
  id: string
  title: string
  content: string
  category: string | null
}

interface TicketDetail {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  customerEmail: string
  customerName: string | null
  assignee: { name: string } | null
  firstReplyAt: string | null
  resolvedAt: string | null
  createdAt: string
  messages: Message[]
  activities: Activity[]
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string

  // LAZY INITIALIZER: localStorage effect ke bahar se lo
  const [workspaceId, setWorkspaceId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("workspaceId") || ""
    }
    return ""
  })

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"reply" | "note">("reply")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
  const [selectedResponseId, setSelectedResponseId] = useState("")

  const loadTicket = useCallback(
    async (wsId: string) => {
      try {
        const data = await api(`/workspaces/${wsId}/tickets/${ticketId}`)
        setTicket(data)
      } catch {
        setTicket(null)
      } finally {
        setLoading(false)
      }
    },
    [ticketId]
  )

  const loadSavedResponses = useCallback(async (wsId: string) => {
    try {
      const data = await api(`/workspaces/${wsId}/saved-responses`)
      setSavedResponses(data)
    } catch {
      setSavedResponses([])
    }
  }, [])

  useEffect(() => {
    if (workspaceId) {
      loadTicket(workspaceId)
      loadSavedResponses(workspaceId)
    } else {
      setLoading(false)
    }
  }, [workspaceId, loadTicket, loadSavedResponses])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !workspaceId) return
    setSending(true)

    try {
      await api(`/workspaces/${workspaceId}/tickets/${ticketId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content: message,
          isInternal: activeTab === "note",
        }),
      })
      setMessage("")
      setSelectedResponseId("")
      await loadTicket(workspaceId)
    } catch {
      alert("Failed to send")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-6">Loading ticket...</div>
  if (!ticket) return <div className="p-6">Ticket not found.</div>

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Back link */}
      <Link
        href="/dashboard/tickets"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tickets
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <Badge className={PRIORITY_COLORS[ticket.priority] || ""}>
            {ticket.priority}
          </Badge>
          <Badge variant="outline">{ticket.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          From: {ticket.customerName || ticket.customerEmail} · Created:{" "}
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Conversation */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description (first message) */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-3">
            {ticket.messages.map((msg) => {
              const isCustomer = !msg.authorId && !msg.isInternal
              const isNote = msg.isInternal

              return (
                <div
                  key={msg.id}
                  className={`border p-4 ${
                    isNote
                      ? "border-amber-200 bg-amber-50"
                      : isCustomer
                        ? "bg-muted/50"
                        : "bg-background"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {isNote
                        ? "Internal Note"
                        : msg.author?.name || msg.authorName || "Customer"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              )
            })}
          </div>

          {/* Composer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("reply")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "reply"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Reply
                </button>
                <button
                  onClick={() => setActiveTab("note")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "note"
                      ? "bg-amber-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Internal Note
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-3">
                {/* Saved Response Picker */}
                {savedResponses.length > 0 && (
                  <div className="mb-2">
                    <Select
                      value={selectedResponseId}
                      onValueChange={(val) => {
                        const safeVal = val || ""
                        if (safeVal === "none") {
                          setSelectedResponseId("")
                          return
                        }
                        const found = savedResponses.find(
                          (r) => r.id === safeVal
                        )
                        if (found) {
                          setMessage(found.content)
                          setSelectedResponseId(safeVal)
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Insert saved response..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Type manually —</SelectItem>
                        {savedResponses.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.title}
                            {r.category ? ` (${r.category})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={
                    activeTab === "reply"
                      ? "Write a reply to the customer..."
                      : "Add an internal note (only team can see)..."
                  }
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={sending} className="gap-2">
                    <Send className="h-4 w-4" />
                    {sending
                      ? "Sending..."
                      : activeTab === "reply"
                        ? "Send Reply"
                        : "Add Note"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4">
          {/* Status & Assignee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{ticket.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium">{ticket.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignee</span>
                <span className="font-medium">
                  {ticket.assignee?.name || "Unassigned"}
                </span>
              </div>
              {ticket.firstReplyAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Reply</span>
                  <span className="font-medium">
                    {new Date(ticket.firstReplyAt).toLocaleString()}
                  </span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-medium">
                    {new Date(ticket.resolvedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                ticket.activities.map((act) => (
                  <div
                    key={act.id}
                    className="border-l-2 border-muted py-1 pl-3 text-xs"
                  >
                    <p className="font-medium capitalize">
                      {act.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-muted-foreground">
                      {act.actor?.name || "System"} ·{" "}
                      {new Date(act.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
