"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Workspace {
  id: string
  name: string
  slug: string
  myRole: string
}

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentId, setCurrentId] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("workspaceId") || ""
    setCurrentId(stored)
    api("/workspaces")
      .then((data) => setWorkspaces(data))
      .catch(() => setWorkspaces([]))
  }, [])

  function switchWorkspace(id: string) {
    if (id === currentId) return
    localStorage.setItem("workspaceId", id)
    window.location.reload()
  }

  const current = workspaces.find((w) => w.id === currentId)

  return (
    <div className="px-4 py-3 border-b">
      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Workspace</p>
      <Select value={currentId} onValueChange={(value) => value && switchWorkspace(value)}>
        <SelectTrigger className="w-full h-9 text-sm font-medium bg-muted/50">
          <SelectValue placeholder="Select workspace">
            {current?.name || "Loading..."}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((ws) => (
            <SelectItem key={ws.id} value={ws.id}>
              <div className="flex flex-col">
                <span>{ws.name}</span>
                <span className="text-xs text-muted-foreground">{ws.myRole}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}