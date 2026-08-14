"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { User } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [wsId, setWsId] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [profile, setProfile] = useState({ name: "", email: "" })
  const [password, setPassword] = useState("")
  const [avatarPreview, setAvatarPreview] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = localStorage.getItem("workspaceId") || ""
    setWsId(id)
    if (id) loadWorkspace(id)
    if (user) {
      setProfile({ name: user.name || "", email: user.email || "" })
      setAvatarPreview(user.avatar || "")
    }
  }, [user])

  async function loadWorkspace(id: string) {
    try {
      const data = await api(`/workspaces/${id}`)
      setWorkspaceName(data.name || "")
    } catch {
      setWorkspaceName("")
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: any = { name: profile.name }
      if (password) body.password = password
      if (avatarPreview && avatarPreview !== user?.avatar) body.avatar = avatarPreview

      const res = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      setUser(res)
      alert("Profile updated")
      setPassword("")
      setAvatarFile(null)
    } catch {
      alert("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  async function updateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!wsId) return
    setLoading(true)
    try {
      await api(`/workspaces/${wsId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: workspaceName }),
      })
      alert("Workspace updated")
    } catch {
      alert("Failed to update workspace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateProfile} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border"
                onClick={() => fileRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Click to upload (max 2MB)</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
            </div>
            <Button type="submit" disabled={loading}>Update Profile</Button>
          </form>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateWorkspace} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workspace Name</label>
              <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>Update Workspace</Button>
          </form>
        </CardContent>
      </Card>

      {/* Saved Responses Link */}
      <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push("/dashboard/settings/saved-responses")}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">Saved Responses</p>
            <p className="text-xs text-muted-foreground">Manage canned replies</p>
          </div>
          <span className="text-muted-foreground">→</span>
        </CardContent>
      </Card>
    </div>
  )
}