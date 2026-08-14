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
  DialogTrigger,
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
  const [editing, setEditing] = useState<SavedResponse | null>(null)
  const [form, setForm] = useState({ title: "", content: "", category: "" })

  useEffect(() => {
    const ws = localStorage.getItem("workspaceId") || ""
    setWorkspaceId(ws)
    if (ws) loadResponses(ws)
  }, [])

  async function loadResponses(wsId: string) {
    try {
      const data = await api(`/workspaces/${wsId}/saved-responses`)
      setResponses(data)
    } catch {
      setResponses([])
    } finally {
      setLoading(false)
    }
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
      setForm({ title: "", content: "", category: "" })
      setEditing(null)
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
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Saved Responses</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Response
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit" : "New"} Saved Response
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g., Escalation"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
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
      </div>

      <div className="space-y-3">
        {responses.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
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
                    <span className="text-xs text-muted-foreground">
                      {r.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(r)
                      setForm({
                        title: r.title,
                        content: r.content,
                        category: r.category || "",
                      })
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {r.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
