"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus } from "lucide-react"

interface SavedResponse {
  id: string
  title: string
  content: string
  category: string | null
  createdBy: { name: string }
}

export default function SavedResponsesPage() {
  const [responses, setResponses] = useState<SavedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SavedResponse | null>(null)
  const [form, setForm] = useState({ title: "", content: "", category: "" })

  useEffect(() => {
    const ws = localStorage.getItem("workspaceId") || ""
    setWorkspaceId(ws)
    if (ws) loadResponses(ws)
  }, [])

  async function loadResponses(wsId: string) {
    try {
      const data = await api<SavedResponse[]>(`/workspaces/${wsId}/saved-responses`)
      setResponses(data)
    } catch {
      setResponses([])
    } finally {
      setLoading(false)
    }
  }

  function openDialog(response?: SavedResponse) {
    if (response) {
      setEditing(response)
      setForm({
        title: response.title,
        content: response.content,
        category: response.category || "",
      })
    } else {
      setEditing(null)
      setForm({ title: "", content: "", category: "" })
    }
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId) return

    try {
      if (editing) {
        await api(`/workspaces/${workspaceId}/saved-responses/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        })
      } else {
        await api(`/workspaces/${workspaceId}/saved-responses`, {
          method: "POST",
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      setEditing(null)
      setForm({ title: "", content: "", category: "" })
      loadResponses(workspaceId)
    } catch {
      alert("Failed to save")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this saved response?")) return
    try {
      await api(`/workspaces/${workspaceId}/saved-responses/${id}`, {
        method: "DELETE",
      })
      loadResponses(workspaceId)
    } catch {
      alert("Failed to delete")
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Saved Responses</h1>
        <Button className="gap-2" onClick={() => openDialog()}>
          <Plus className="w-4 h-4" /> Add Response
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "New"} Saved Response
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Greeting"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g., Escalation"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
                placeholder="Type the response template here..."
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {responses.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            No saved responses yet.
          </p>
        )}
        {responses.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  {r.category && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {r.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDialog(r)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {r.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}