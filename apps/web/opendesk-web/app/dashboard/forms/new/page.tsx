"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NewFormPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [fields, setFields] = useState<FieldDraft[]>([
    { label: "Name", type: "TEXT", required: true },
    { label: "Email", type: "EMAIL", required: true },
  ])
  const [loading, setLoading] = useState(false)

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
    const wsId = localStorage.getItem("workspaceId")
    if (!wsId) return

    if (fields.some((f) => !f.label.trim())) {
      alert("All fields need a label")
      return
    }

    setLoading(true)
    try {
      await api(`/workspaces/${wsId}/forms`, {
        method: "POST",
        body: JSON.stringify({ name, description, fields }),
      })
      router.push("/dashboard/forms")
    } catch (err: any) {
      alert(err.message || "Failed to create form")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">New Form</h1>

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
                placeholder="Contact Us"
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
                placeholder="We'll get back to you within 24 hours"
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
            {loading ? "Creating..." : "Create Form"}
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
