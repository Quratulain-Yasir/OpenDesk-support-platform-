"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useDroppable } from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"

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
  { key: "IN_PROGRESS", label: "In Progress", color: "border-t-2 border-yellow-500" },
  { key: "WAITING", label: "Waiting", color: "border-t-2 border-orange-500" },
  { key: "RESOLVED", label: "Resolved", color: "border-t-2 border-green-500" },
]

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
}

// ---- Draggable ticket card ----
function TicketCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  })

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0.4 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border bg-background transition-shadow hover:shadow-sm"
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <Link href={`/dashboard/tickets/${ticket.id}`} className="block p-3 pb-0">
          <div className="mb-2 flex items-start justify-between">
            <Badge className={PRIORITY_COLORS[ticket.priority] || ""}>
              {ticket.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {ticket._count.messages} msgs
            </span>
          </div>
          <p className="mb-2 line-clamp-2 text-sm font-medium">{ticket.subject}</p>
          <p className="mb-3 text-xs text-muted-foreground">
            {ticket.customerName || ticket.customerEmail}
          </p>
        </Link>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {ticket.assignee?.name || "Unassigned"}
        </span>
      </div>
    </div>
  )
}

// ---- Droppable column ----
function Column({
  col,
  tickets,
}: {
  col: (typeof COLUMNS)[number]
  tickets: Ticket[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })

  return (
    <div
      ref={setNodeRef}
      className={`border bg-card ${col.color} ${isOver ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="border-b bg-muted/50 p-3">
        <h3 className="text-sm font-semibold">
          {col.label} ({tickets.length})
        </h3>
      </div>
      <div className="min-h-[200px] space-y-3 p-3">
        {tickets.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No tickets</p>
        )}
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  )
}

export default function TicketsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState("")
  const [error, setError] = useState("")
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Click vs drag differentiate karne ke liye
    })
  )

  async function loadTickets(wsId: string) {
    try {
      const data = await api(`/workspaces/${wsId}/tickets`)
      setTickets(data)
      setError("")
    } catch (err) {
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
        .catch(() => {
          setError("Please login first")
          setLoading(false)
        })
    }
  }, [])

  async function updateStatus(ticketId: string, newStatus: string) {
    // Optimistic update — turant UI mein move karo, backend background mein update ho
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    )
    try {
      await api(`/workspaces/${workspaceId}/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      alert("Failed to update status")
      loadTickets(workspaceId) // Fail hua toh sahi state wapas laao
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const ticket = tickets.find((t) => t.id === event.active.id)
    setActiveTicket(ticket || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTicket(null)
    if (!over) return

    const ticketId = active.id as string
    const newStatus = over.id as string

    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === newStatus) return

    updateStatus(ticketId, newStatus)
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

  if (error === "No workspaces found" || !workspaceId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h1 className="mb-2 text-2xl font-bold">No Workspace Found</h1>
        <p className="mb-6 max-w-sm text-muted-foreground">
          You are not a member of any workspace yet. Create one to start managing tickets.
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.key)
            return <Column key={col.key} col={col} tickets={colTickets} />
          })}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <div className="w-64 border bg-background shadow-lg opacity-90">
              <div className="p-3">
                <Badge className={PRIORITY_COLORS[activeTicket.priority] || ""}>
                  {activeTicket.priority}
                </Badge>
                <p className="mt-2 text-sm font-medium">{activeTicket.subject}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}