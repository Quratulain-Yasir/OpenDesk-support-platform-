const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.accessToken || null
  } catch {
    return null
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // SSR safety — localStorage sirf browser pe available
  if (typeof window === "undefined") {
    throw new Error("api() can only be called in the browser")
  }

  const token = localStorage.getItem('accessToken');

  const makeRequest = async (accessToken: string | null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    })
    return res
  }

  let res = await makeRequest(token)

  // Token expire ho gaya → refresh karo
  if (res.status === 401 && token) {
    const newToken = await refreshToken()
    if (newToken) {
      localStorage.setItem("accessToken", newToken)
      res = await makeRequest(newToken)
    } else {
      localStorage.removeItem("accessToken")
      window.location.href = "/login"
    }
  }

  // Agar token hi nahi tha aur 401 aaya → login pe bhejo
  if (res.status === 401 && !token) {
    window.location.href = "/login"
    throw new Error("Unauthorized")
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || "Request failed")
  }

  return res.json()
}
