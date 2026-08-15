"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Users } from "lucide-react"

interface Analytics {
  resolvedThisWeek: number
  avgResponseTime: number
  ticketsPerAgent: { agentName: string; count: number }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [workspaceId, setWorkspaceId] = useState("")

  useEffect(() => {
    const ws = localStorage.getItem("workspaceId") || ""
    setWorkspaceId(ws)
    if (ws) loadAnalytics(ws)
  }, [])

  async function loadAnalytics(wsId: string) {
    try {
      const data = await api(`/workspaces/${wsId}/analytics`)
      setAnalytics(data)
    } catch {
      setAnalytics(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => router.push("/dashboard/tickets")}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          View Tickets →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Resolved This Week
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.resolvedThisWeek ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg First Response
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics ? `${analytics.avgResponseTime}m` : "0m"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.ticketsPerAgent.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics && analytics.ticketsPerAgent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tickets Per Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.ticketsPerAgent.map((agent) => (
                <div
                  key={agent.agentName}
                  className="flex justify-between text-sm"
                >
                  <span>{agent.agentName}</span>
                  <span className="font-medium">{agent.count} tickets</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
