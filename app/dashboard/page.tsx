"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, TableProperties, TrendingUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { reservationsAPI } from "@/lib/api/reservations"
import { tablesAPI } from "@/lib/api/tables"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalReservations: 0,
    todayReservations: 0,
    totalTables: 0,
    availableTables: 0,
  })
  const [recentReservations, setRecentReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!isAuthenticated) return

      try {
        const [reservationStats, tableStats, reservations] = await Promise.all([
          reservationsAPI.getStats(),
          tablesAPI.getStats(),
          reservationsAPI.getAll(),
        ])

        setStats({
          totalReservations: reservationStats.total,
          todayReservations: reservationStats.today,
          totalTables: tableStats.total,
          availableTables: tableStats.available,
        })

        // Get recent reservations (last 4)
        setRecentReservations(reservations.slice(0, 4))
      } catch (error) {
        console.error("[v0] Failed to load dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [isAuthenticated, toast])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Menu Principal</h1>
        <p className="text-muted-foreground mt-2">Bienvenido!</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Reservaciones totales
                </CardTitle>
                <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.totalReservations}</div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Este mes</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Reservaciones de hoy
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.todayReservations}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Reservas activas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total de mesas</CardTitle>
                <TableProperties className="w-4 h-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalTables}</div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">En el restaurante</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Mesas disponibles
                </CardTitle>
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.availableTables}</div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Ahora</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reservaciones recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReservations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Sin reservaciones recientes</p>
                  ) : (
                    recentReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{reservation.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            Mesa {reservation.tableNumber || reservation.tableId} • {reservation.guests} Clientes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{reservation.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Menú de Accciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => (window.location.href = "/dashboard/reservations")}
                    className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-lg transition-all transform hover:scale-105"
                  >
                    <Calendar className="w-6 h-6 mb-2" />
                    <p className="font-medium">Nueva Reservacion</p>
                  </button>
                  <button
                    onClick={() => (window.location.href = "/dashboard/tables")}
                    className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg transition-all transform hover:scale-105"
                  >
                    <TableProperties className="w-6 h-6 mb-2" />
                    <p className="font-medium">Gestionar mesas</p>
                  </button>
                  <button
                    onClick={() => (window.location.href = "/dashboard/users")}
                    className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all transform hover:scale-105"
                  >
                    <Users className="w-6 h-6 mb-2" />
                    <p className="font-medium">Gestionar Usuarios</p>
                  </button>
                  <button
                    onClick={() => (window.location.href = "/dashboard/reports")}
                    className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-all transform hover:scale-105"
                  >
                    <TrendingUp className="w-6 h-6 mb-2" />
                    <p className="font-medium">Generar reporte PDF</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
