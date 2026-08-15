"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  customerName: string | null
  customerEmail: string
  assignee: { name: string } | null
  _count: { messages: number }
  createdAt: string
}

const COLUMNS = [
  { key: "OPEN", label: "Open", color: "border-t-2 border-blue-500" },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    color: "border-t-2 border-yellow-500",
  },
  { key: "WAITING", label: "Waiting", color: "border-t-2 border-orange-500" },
  { key: "RESOLVED", label: "Resolved", color: "border-t-2 border-green-500" },
]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

export default function TicketsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState("")
  const [error, setError] = useState("")

  async function loadTickets(wsId: string) {
    try {
      console.log("Fetching tickets for workspace:", wsId)
      const data = await api(`/workspaces/${wsId}/tickets`)
      console.log("Tickets loaded:", data)
      setTickets(data)
      setError("")
    } catch (err) {
      console.error("Failed to load tickets:", err)
      setError(err instanceof Error ? err.message : "Failed to load tickets")
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("workspaceId")
    if (stored) {
      setWorkspaceId(stored)
      loadTickets(stored)
    } else {
      api("/workspaces")
        .then((workspaces) => {
          if (workspaces.length > 0) {
            const id = workspaces[0].id
            localStorage.setItem("workspaceId", id)
            setWorkspaceId(id)
            loadTickets(id)
          } else {
            setError("No workspaces found")
            setLoading(false)
          }
        })
        .catch((err) => {
          console.error(err)
          setError("Please login first")
          setLoading(false)
        })
    }
  }, [])

  async function updateStatus(ticketId: string, newStatus: string) {
    try {
      await api(`/workspaces/${workspaceId}/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      loadTickets(workspaceId)
    } catch {
      alert("Failed to update status")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  // No workspace found → Show CTA to create one
  if (error === "No workspaces found" || !workspaceId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold">No Workspace Found</h1>
        <p className="mb-6 max-w-sm text-muted-foreground">
          You are not a member of any workspace yet. Create one to start
          managing tickets.
        </p>
        <Button onClick={() => router.push("/onboarding")} size="lg">
          Create Workspace
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold">Tickets</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Tickets</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className={`border bg-card ${col.color}`}>
              <div className="border-b bg-muted/50 p-3">
                <h3 className="text-sm font-semibold">
                  {col.label} ({colTickets.length})
                </h3>
              </div>
              <div className="min-h-[200px] space-y-3 p-3">
                {colTickets.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No tickets
                  </p>
                )}
                {colTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border bg-background transition-shadow hover:shadow-sm"
                  >
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="block p-3 pb-0"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <Badge
                          className={PRIORITY_COLORS[ticket.priority] || ""}
                        >
                          {ticket.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ticket._count.messages} msgs
                        </span>
                      </div>
                      <p className="mb-2 line-clamp-2 text-sm font-medium">
                        {ticket.subject}
                      </p>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {ticket.customerName || ticket.customerEmail}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {ticket.assignee?.name || "Unassigned"}
                      </span>
                      <Select
                        defaultValue={ticket.status}
                        onValueChange={(val) =>
                          val && updateStatus(ticket.id, val)
                        }
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            In Progress
                          </SelectItem>
                          <SelectItem value="WAITING">Waiting</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
