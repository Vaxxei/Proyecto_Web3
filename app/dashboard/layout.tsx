"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Dashboard layout - loading:", loading, "isAuthenticated:", isAuthenticated)
    if (!loading && !isAuthenticated) {
      console.log("[v0] Not authenticated, redirecting to login")
      router.replace("/login")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    console.log("[v0] Dashboard layout showing loading spinner")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log("[v0] Dashboard layout - not authenticated, returning null")
    return null
  }

  console.log("[v0] Dashboard layout - rendering dashboard")
  return <DashboardLayout>{children}</DashboardLayout>
}
