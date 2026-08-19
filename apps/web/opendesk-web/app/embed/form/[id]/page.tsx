"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

interface Field {
  id: string
  label: string
  type: string
  required: boolean
  options: string[]
}

interface FormData {
  id: string
  name: string
  description: string | null
  fields: Field[]
}

export default function EmbedFormPage() {
  const params = useParams()
  const formId = params.id as string

  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<Record<string, any>>({})

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

  useEffect(() => {
    fetch(`${apiUrl}/public/forms/${formId}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => setForm(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [formId])

  function updateValue(fieldId: string, value: any) {
    setValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return

    // Field id ki jagah label ko key banate hain — backend mein bhi yehi convention follow ki
    const data: Record<string, any> = {}
    form.fields.forEach((f) => {
      data[f.label] = values[f.id] ?? ""
    })

    setSubmitting(true)
    try {
      const res = await fetch(`${apiUrl}/public/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
      if (!res.ok) throw new Error()
      setSubmitted(true)
    } catch {
      alert("Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  if (error || !form)
    return <div className="p-4 text-sm text-red-600">Form not found.</div>

  if (submitted) {
    return (
      <div className="p-4 text-sm text-green-600">
        Thank you! Your submission was received.
      </div>
    )
  }

  return (
    <div className="max-w-md p-4">
      <h3 className="mb-1 text-lg font-semibold">{form.name}</h3>
      {form.description && (
        <p className="mb-4 text-xs text-muted-foreground">{form.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {form.fields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {field.label} {field.required && "*"}
            </label>

            {field.type === "TEXTAREA" ? (
              <textarea
                required={field.required}
                onChange={(e) => updateValue(field.id, e.target.value)}
                className="min-h-20 border p-2 text-sm"
              />
            ) : field.type === "DROPDOWN" ? (
              <select
                required={field.required}
                onChange={(e) => updateValue(field.id, e.target.value)}
                className="border p-2 text-sm"
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "CHECKBOX" ? (
              <input
                type="checkbox"
                onChange={(e) => updateValue(field.id, e.target.checked)}
              />
            ) : (
              <input
                type={
                  field.type === "EMAIL"
                    ? "email"
                    : field.type === "PHONE"
                      ? "tel"
                      : "text"
                }
                required={field.required}
                onChange={(e) => updateValue(field.id, e.target.value)}
                className="border p-2 text-sm"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black p-2 text-sm text-white"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  )
}
