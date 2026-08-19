"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"

interface FieldDraft {
  label: string
  type: string
  required: boolean
}

const FIELD_TYPES = [
  "TEXT",
  "EMAIL",
  "PHONE",
  "TEXTAREA",
  "DROPDOWN",
  "CHECKBOX",
]

export default function EditFormPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [fields, setFields] = useState<FieldDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [wsId, setWsId] = useState("")

  useEffect(() => {
    const id = localStorage.getItem("workspaceId") || ""
    setWsId(id)
    if (id) loadForm(id)
  }, [])

  async function loadForm(workspaceId: string) {
    try {
      const data = await api(`/workspaces/${workspaceId}/forms/${formId}`)
      setName(data.name)
      setDescription(data.description || "")
      // Backend se aane wale fields mein extra properties (id, order, formId) hain —
      // hum sirf woh 3 fields nikaal rahe hain jo edit form ko chahiye
      setFields(
        data.fields.map((f: any) => ({
          label: f.label,
          type: f.type,
          required: f.required,
        }))
      )
    } catch {
      alert("Failed to load form")
      router.push("/dashboard/forms")
    } finally {
      setInitialLoading(false)
    }
  }

  function addField() {
    setFields([...fields, { label: "", type: "TEXT", required: false }])
  }

  function updateField(index: number, key: keyof FieldDraft, value: any) {
    const copy = [...fields]
    copy[index] = { ...copy[index], [key]: value }
    setFields(copy)
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return

    if (fields.some((f) => !f.label.trim())) {
      alert("All fields need a label")
      return
    }

    setLoading(true)
    try {
      await api(`/workspaces/${wsId}/forms/${formId}`, {
        method: "PATCH",
        body: JSON.stringify({ name, description, fields }),
      })
      router.push("/dashboard/forms")
    } catch (err: any) {
      alert(err.message || "Failed to update form")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="p-6">Loading form...</div>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Form</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Form Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Form Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Description (optional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="flex items-center gap-2 border p-3">
                <Input
                  className="flex-1"
                  placeholder="Field label"
                  value={field.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                />
                <Select
                  value={field.type}
                  onValueChange={(v) => v && updateField(index, "type", v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(index, "required", e.target.checked)
                    }
                  />
                  Required
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
            >
              + Add Field
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/forms")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
