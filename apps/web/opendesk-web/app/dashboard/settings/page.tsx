"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { User } from "lucide-react"

// Extend user type locally for avatar
interface UserWithAvatar {
  name?: string
  email?: string
  avatar?: string
}

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
      const u = user as UserWithAvatar
      setProfile({ name: u.name || "", email: u.email || "" })
      setAvatarPreview(u.avatar || "")
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

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const size = 128
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext("2d")
          ctx?.drawImage(img, 0, 0, size, size)
          resolve(canvas.toDataURL("image/jpeg", 0.7))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setAvatarPreview(compressed)
    setAvatarFile(file)
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const body: any = { name: profile.name }
      if (password) body.password = password
      const currentAvatar = (user as UserWithAvatar)?.avatar
      if (avatarPreview && avatarPreview !== currentAvatar)
        body.avatar = avatarPreview

      const res = await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      setUser(res)
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
    <div className="mx-auto max-w-2xl space-y-6 p-6">
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
                className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-muted"
                onClick={() => fileRef.current?.click()}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  Change Avatar
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click to upload (max 2MB)
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={profile.email} disabled className="bg-muted" />
              <p className="mt-1 text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Update Profile
            </Button>
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
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              Update Workspace
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Saved Responses Link */}
      <Card
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => router.push("/dashboard/settings/saved-responses")}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium">Saved Responses</p>
            <p className="text-xs text-muted-foreground">
              Manage canned replies
            </p>
          </div>
          <span className="text-muted-foreground">→</span>
        </CardContent>
      </Card>
    </div>
  )
}
