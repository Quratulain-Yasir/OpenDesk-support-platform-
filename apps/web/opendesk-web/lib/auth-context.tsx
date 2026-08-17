"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) setUserState(JSON.parse(stored))
  }, [])

  // YEH ADD KIYA — state + localStorage dono update karega
  const setUser = (u: User | null) => {
    setUserState(u)
    if (u) localStorage.setItem("user", JSON.stringify(u))
    else localStorage.removeItem("user")
  }

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    setUserState(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
