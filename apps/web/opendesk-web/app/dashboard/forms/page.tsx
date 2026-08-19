"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Form {
  id: string
  name: string
  description: string | null
  isPublished: boolean
  _count: { leads: number }
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [wsId, setWsId] = useState("")
  const [copiedId, setCopiedId] = useState("")

  useEffect(() => {
    const id = localStorage.getItem("workspaceId") || ""
    setWsId(id)
    if (id) loadForms(id)
  }, [])

  async function loadForms(id: string) {
    try {
      const data = await api(`/workspaces/${id}/forms`)
      setForms(data)
    } catch {
      setForms([])
    } finally {
      setLoading(false)
    }
  }

  async function togglePublish(formId: string, current: boolean) {
    try {
      await api(`/workspaces/${wsId}/forms/${formId}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !current }),
      })
      loadForms(wsId)
    } catch {
      alert("Failed to update form status")
    }
  }

  function copyEmbedCode(formId: string) {
    // NEXT_PUBLIC_API_URL wahi hai jo lib/api.ts mein use hota hai
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    const embedCode = `<script src="${apiUrl}/embed.js" data-form-id="${formId}"></script>`
    navigator.clipboard.writeText(embedCode)
    setCopiedId(formId)
    setTimeout(() => setCopiedId(""), 2000)
  }

  async function deleteForm(formId: string) {
    if (!confirm("Delete this form? This cannot be undone.")) return
    try {
      await api(`/workspaces/${wsId}/forms/${formId}`, { method: "DELETE" })
      loadForms(wsId)
    } catch {
      alert("Failed to delete form")
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Forms</h1>
        <Link href="/dashboard/forms/new">
          <Button>New Form</Button>
        </Link>
      </div>

      {forms.length === 0 && (
        <p className="text-muted-foreground">No forms yet. Create one to start capturing leads.</p>
      )}

      <div className="space-y-3">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{form.name}</p>
                  {form.description && (
                    <p className="text-xs text-muted-foreground">{form.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {form._count.leads} leads received
                  </p>
                </div>
                <Badge variant={form.isPublished ? "default" : "secondary"}>
                  {form.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/dashboard/forms/${form.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(form.id, form.isPublished)}
                >
                  {form.isPublished ? "Unpublish" : "Publish"}
                </Button>
                {form.isPublished && (
                  <Button variant="outline" size="sm" onClick={() => copyEmbedCode(form.id)}>
                    {copiedId === form.id ? "Copied!" : "Copy Embed Code"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => deleteForm(form.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
