"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react"
import ReservationDialog from "@/components/reservations/reservation-dialog"
import ReservationViewDialog from "@/components/reservations/reservation-view-dialog"
import DeleteConfirmDialog from "@/components/shared/delete-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { reservationsAPI } from "@/lib/api/reservations"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  date: string
  time: string
  guests: number
  tableNumber: string
  tableId?: number
  status: "pending" | "confirmed" | "completed" | "cancelled"
  specialRequests?: string
  isDeleted: boolean
}

export default function ReservationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const data = await reservationsAPI.getAll()
      setReservations(Array.isArray(data) ? data : [])
    } catch (error) {
      setReservations([])
      toast({
        title: "Error",
        description: "Error al cargar las reservas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredReservations = (reservations || []).filter(
    (res) =>
      !res.isDeleted &&
      (res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customerPhone.includes(searchTerm)),
  )

  const handleCreate = () => {
    setSelectedReservation(null)
    setDialogOpen(true)
  }

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setDialogOpen(true)
  }

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setViewDialogOpen(true)
  }

  const handleDeleteClick = (reservation: Reservation) => {
    setReservationToDelete(reservation)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (reservationToDelete) {
      try {
        await reservationsAPI.delete(reservationToDelete.id)
        toast({
          title: "Exito",
          description: "Se elimino la reservacion con exito",
        })
        await loadReservations()
        setDeleteDialogOpen(false)
        setReservationToDelete(null)
      } catch (error) {
        toast({
          title: "Error",
          description: "Fallo al eliminar la reservacion.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSave = async (reservation: Reservation) => {
    try {
      if (selectedReservation) {
        await reservationsAPI.update(reservation.id, reservation)
        toast({ title: "Exito", description: "Reserva actualizada" })
      } else {
        await reservationsAPI.create(reservation)
        toast({ title: "Exito", description: "Reserva creada" })
      }
      await loadReservations()
      setDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Fallo al guardar la reserva.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: Reservation["status"]) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }
    return <Badge className={variants[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reservaciones</h1>
          <p className="text-muted-foreground mt-2">Gestionar reservaciones</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva reservacion
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invitados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mesa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No se encontraron reservaciones
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-secondary/50">
                    <td className="px-6 py-4">
                      <p className="font-medium">{reservation.customerName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{reservation.customerEmail}</p>
                      <p className="text-sm text-muted-foreground">{reservation.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{new Date(reservation.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{reservation.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{reservation.guests} invitados</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">
                        Mesa {reservation.tableNumber || reservation.tableId}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(reservation.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(reservation)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(reservation)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(reservation)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reservation={selectedReservation}
        onSave={handleSave}
      />

      <ReservationViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        reservation={selectedReservation}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Eliminar Reserva"
        description="Estas seguro de eliminar la reserva ?"
      />
    </div>
  )
}
