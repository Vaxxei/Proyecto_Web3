"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tablesAPI } from "@/lib/api/tables"
import type { RestaurantTable } from "@/lib/api/tables"

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

interface ReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation: Reservation | null
  onSave: (reservation: Reservation) => void
}

export default function ReservationDialog({ open, onOpenChange, reservation, onSave }: ReservationDialogProps) {
  const [availableTables, setAvailableTables] = useState<RestaurantTable[]>([])
  const [loadingTables, setLoadingTables] = useState(false)

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    date: "",
    time: "",
    guests: 2,
    tableNumber: "",
    tableId: undefined as number | undefined,
    status: "pending" as "pending" | "confirmed" | "completed" | "cancelled",
    specialRequests: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadTables = async () => {
      if (open) {
        setLoadingTables(true)
        try {
          const tables = await tablesAPI.getAll()
          const filtered = tables.filter(
            (table) =>
              table.status === "available" ||
              (reservation && table.id !== undefined && table.id === reservation.tableId),
          )
          setAvailableTables(filtered)
        } catch (error) {
          console.error("[v0] Error loading tables:", error)
        } finally {
          setLoadingTables(false)
        }
      }
    }
    loadTables()
  }, [open, reservation])

  useEffect(() => {
    if (reservation) {
      const validStatuses = ["pending", "confirmed", "completed", "cancelled"] as const
      type Status = (typeof validStatuses)[number]
      const statusValue: Status = validStatuses.includes(reservation.status as Status)
        ? (reservation.status as Status)
        : "pending"

      setFormData({
        customerName: reservation.customerName || "",
        customerEmail: reservation.customerEmail || "",
        customerPhone: reservation.customerPhone || "",
        date: reservation.date || "",
        time: reservation.time || "",
        guests: reservation.guests || 2,
        tableNumber: reservation.tableNumber || "",
        tableId: reservation.tableId,
        status: statusValue,
        specialRequests: reservation.specialRequests || "",
      })
    } else {
      setFormData({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        date: "",
        time: "",
        guests: 2,
        tableNumber: "",
        tableId: undefined,
        status: "pending",
        specialRequests: "",
      })
    }
    setErrors({})
  }, [reservation, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required"
    } else if (formData.customerName.trim().length < 3) {
      newErrors.customerName = "Name must be at least 3 characters"
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Email is invalid"
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required"
    } else if (!/^[\d\s+()-]+$/.test(formData.customerPhone)) {
      newErrors.customerPhone = "Phone number is invalid"
    } else if (formData.customerPhone.replace(/\D/g, "").length < 10) {
      newErrors.customerPhone = "Phone number must be at least 10 digits"
    }

    if (!formData.date) {
      newErrors.date = "Date is required"
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past"
      }
    }

    if (!formData.time) {
      newErrors.time = "Time is required"
    }

    if (!formData.guests || formData.guests < 1) {
      newErrors.guests = "Number of guests must be at least 1"
    } else if (formData.guests > 20) {
      newErrors.guests = "Maximum 20 guests per reservation"
    }

    if (!formData.tableId) {
      newErrors.tableId = "Please select a table"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const selectedTable = availableTables.find((t) => t.id === formData.tableId)

    const formattedTime = formData.time.trim()

    onSave({
      id: reservation?.id || "",
      customerName: formData.customerName.trim(),
      customerEmail: formData.customerEmail.trim(),
      customerPhone: formData.customerPhone.trim(),
      date: formData.date.trim(),
      time: formattedTime,
      guests: formData.guests,
      tableNumber: selectedTable?.tableNumber || formData.tableNumber,
      tableId: formData.tableId,
      status: formData.status,
      specialRequests: formData.specialRequests.trim(),
      isDeleted: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reservation ? "Editar reserva" : "Nueva Reservacion"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nombre del Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Brian Sanchez"
                className={errors.customerName ? "border-destructive" : ""}
              />
              {errors.customerName && <p className="text-sm text-destructive">{errors.customerName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="brian@gmail.com"
                className={errors.customerEmail ? "border-destructive" : ""}
              />
              {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">
                Telefono <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+591 60116747"
                className={errors.customerPhone ? "border-destructive" : ""}
              />
              {errors.customerPhone && <p className="text-sm text-destructive">{errors.customerPhone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">
                Numero de Clientes <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guests"
                type="number"
                min="1"
                max="20"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: Number.parseInt(e.target.value) || 0 })}
                className={errors.guests ? "border-destructive" : ""}
              />
              {errors.guests && <p className="text-sm text-destructive">{errors.guests}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                Hora <span className="text-destructive">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className={errors.time ? "border-destructive" : ""}
              />
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableId">
                Mesa <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tableId?.toString() || ""}
                onValueChange={(value) => {
                  const tableId = Number.parseInt(value)
                  const table = availableTables.find((t) => t.id === tableId)
                  setFormData({
                    ...formData,
                    tableId,
                    tableNumber: table?.tableNumber || "",
                  })
                }}
                disabled={loadingTables}
              >
                <SelectTrigger className={errors.tableId ? "border-destructive" : ""}>
                  <SelectValue placeholder={loadingTables ? "Cargando mesas..." : "Elija una mesa"} />
                </SelectTrigger>
                <SelectContent>
                  {availableTables
                    .filter((table) => table.id !== undefined)
                    .map((table) => (
                      <SelectItem key={table.id} value={table.id!.toString()}>
                        Mesa {table.tableNumber} - {table.location} (Capacidad: {table.capacity})
                      </SelectItem>
                    ))}
                  {availableTables.length === 0 && !loadingTables && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay mesas disponibles</div>
                  )}
                </SelectContent>
              </Select>
              {errors.tableId && <p className="text-sm text-destructive">{errors.tableId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Detalles especiales</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder="Requerimientos especiales ..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
            >
              {reservation ? "Update" : "Crear"} Reservacion
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
