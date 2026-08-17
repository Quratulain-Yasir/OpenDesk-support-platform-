"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [status, setStatus] = useState<"checking" | "needAuth" | "accepting" | "success" | "error">("checking")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      setStatus("needAuth")
      // Save token so we can come back here after login/signup
      localStorage.setItem("pendingInviteToken", token)
      return
    }
    acceptInvite()
  }, [])

  async function acceptInvite() {
    setStatus("accepting")
    try {
      const res = await api(`/workspaces/accept/${token}`, {
        method: "POST",
      })
      if (res?.workspaceId) {
        localStorage.setItem("workspaceId", res.workspaceId)
      }
      localStorage.removeItem("pendingInviteToken")
      setStatus("success")
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message || "Failed to accept invite")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "checking" && (
            <p className="text-muted-foreground">Checking invitation...</p>
          )}

          {status === "needAuth" && (
            <>
              <h2 className="text-xl font-bold mb-2">You've been invited</h2>
              <p className="text-muted-foreground mb-6">
                Log in or create an account to accept this invitation.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => router.push(`/login?redirect=/invite/${token}`)}>
                  Log In
                </Button>
                <Button variant="outline" onClick={() => router.push(`/signup?redirect=/invite/${token}`)}>
                  Create Account
                </Button>
              </div>
            </>
          )}

          {status === "accepting" && (
            <p className="text-muted-foreground">Joining workspace...</p>
          )}

          {status === "success" && (
            <>
              <h2 className="text-xl font-bold mb-2 text-green-600">You're in!</h2>
              <p className="text-muted-foreground">Redirecting to your dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="text-xl font-bold mb-2 text-destructive">Invitation Error</h2>
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}