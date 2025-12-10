"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authAPI, type User } from "@/lib/api/auth"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token")
      console.log("[v0] Loading user, token exists:", !!token)
      if (token) {
        try {
          console.log("[v0] Fetching current user from API")
          const userData = await authAPI.getCurrentUser()
          console.log("[v0] User loaded successfully:", userData)
          setUser(userData)
        } catch (error: any) {
          console.error("[v0] Failed to load user:", error.message)
          if (error.response?.status === 401) {
            console.log("[v0] Token invalid, clearing storage")
            localStorage.removeItem("token")
            localStorage.removeItem("user")
          }
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("[v0] Login attempt with email:", email)
      const response = await authAPI.login({ email, password })
      console.log("[v0] Login API response:", response)

      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
      console.log("[v0] User state updated, token saved")
    } catch (error: any) {
      console.error("[v0] Login error:", error.response?.data || error.message)
      throw new Error(error.response?.data?.message || "Login failed")
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log("[v0] Registration data:", { name, email, passwordLength: password.length })
      const response = await authAPI.register({ name, email, password })
      console.log("[v0] Registration successful:", response.user)

      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      setUser(response.user)
    } catch (error: any) {
      console.error("[v0] Registration error details:", error.response?.data)
      const errorMessage = error.response?.data?.errors
        ? error.response.data.errors.map((e: any) => e.msg).join(", ")
        : error.response?.data?.message || "Registration failed"
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const rolePermissions: Record<string, string[]> = {
      admin: ["all"],
      manager: ["view_reservations", "create_reservations", "edit_reservations", "view_tables", "view_reports"],
      staff: ["view_reservations", "view_tables"],
    }

    const permissions = rolePermissions[user.role] || []
    return permissions.includes("all") || permissions.includes(permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
