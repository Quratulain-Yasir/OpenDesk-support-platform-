"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { publicApi } from "@/lib/public-api"
import Link from "next/link"

interface Message {
  id: string
  content: string
  isInternal: boolean
  authorName: string | null
  createdAt: string
  author?: { name: string } | null
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  customerEmail: string
  customerName: string | null
  createdAt: string
  messages: Message[]
}

export default function TrackTicketPage() {
  const params = useParams()
  const token = params.token as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  async function loadTicket() {
    try {
      const data = await publicApi(`/public/tickets/${token}`)
      setTicket(data)
    } catch {
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTicket()
  }, [token])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)

    try {
      await publicApi(`/public/tickets/${token}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: reply }),
      })
      setReply("")
      await loadTicket() // Reload to show new message
    } catch {
      alert("Failed to send reply")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-12 text-center">Loading...</div>
  if (!ticket) return <div className="p-12 text-center">Ticket not found.</div>

  const priorityColors: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    URGENT: "bg-red-100 text-red-800",
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Submit another ticket
          </Link>
          <span className="text-xs text-muted-foreground">Public Tracking</span>
        </div>
        {/* Ticket Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{ticket.subject}</CardTitle>
              <Badge className={priorityColors[ticket.priority] || ""}>
                {ticket.priority}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Status:{" "}
                <span className="font-medium text-foreground">
                  {ticket.status}
                </span>
              </p>
              <p>From: {ticket.customerName || ticket.customerEmail}</p>
              <p>Submitted: {new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{ticket.description}</p>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet.</p>
            ) : (
              ticket.messages.map((msg) => (
                <div key={msg.id} className="border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {msg.author?.name || msg.authorName || "Customer"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Reply Box */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReply} className="space-y-4">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Type your reply..."
                required
              />
              <Button type="submit" disabled={sending} className="bg-primary">
                {sending ? "Sending..." : "Send Reply"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
