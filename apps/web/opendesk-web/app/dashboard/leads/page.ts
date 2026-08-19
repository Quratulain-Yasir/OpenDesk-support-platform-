"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"

interface Lead {
  id: string
  data: Record<string, any>
  status: string
  createdAt: string
  form: { name: string }
}

const COLUMNS = [
  { key: "NEW", label: "New", color: "border-t-2 border-blue-500" },
  { key: "CONTACTED", label: "Contacted", color: "border-t-2 border-yellow-500" },
  { key: "QUALIFIED", label: "Qualified", color: "border-t-2 border-orange-500" },
  { key: "WON", label: "Won", color: "border-t-2 border-green-500" },
  { key: "LOST", label: "Lost", color: "border-t-2 border-red-500" },
]

// Lead.data ke andar pehla field jo mile (usually "Name" ya "Email") wahi title ki tarah dikhao
function getLeadTitle(lead: Lead) {
  const values = Object.values(lead.data)
  return values[0] || "Untitled Lead"
}

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
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
      {...listeners}
      {...attributes}
      className="border bg-background p-3 cursor-grab active:cursor-grabbing hover:shadow-sm"
    >
      <p className="text-sm font-medium mb-1">{getLeadTitle(lead)}</p>
      <p className="text-xs text-muted-foreground">{lead.form.name}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(lead.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}

function Column({ col, leads }: { col: (typeof COLUMNS)[number]; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key })

  return (
    <div ref={setNodeRef} className={`border bg-card ${col.color} ${isOver ? "ring-2 ring-primary/40" : ""}`}>
      <div className="border-b bg-muted/50 p-3">
        <h3 className="text-sm font-semibold">
          {col.label} ({leads.length})
        </h3>
      </div>
      <div className="min-h-[200px] space-y-3 p-3">
        {leads.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No leads</p>
        )}
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [wsId, setWsId] = useState("")
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    const id = localStorage.getItem("workspaceId") || ""
    setWsId(id)
    if (id) loadLeads(id)
  }, [])

  async function loadLeads(id: string) {
    try {
      const data = await api(`/workspaces/${id}/leads`)
      setLeads(data)
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(leadId: string, newStatus: string) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)))
    try {
      await api(`/workspaces/${wsId}/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      alert("Failed to update lead status")
      loadLeads(wsId)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id)
    setActiveLead(lead || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveLead(null)
    if (!over) return

    const leadId = active.id as string
    const newStatus = over.id as string
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    updateStatus(leadId, newStatus)
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Leads</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => l.status === col.key)
            return <Column key={col.key} col={col} leads={colLeads} />
          })}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="w-64 border bg-background shadow-lg opacity-90 p-3">
              <p className="text-sm font-medium">{getLeadTitle(activeLead)}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}