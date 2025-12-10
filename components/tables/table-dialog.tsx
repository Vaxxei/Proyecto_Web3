"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RestaurantTable } from "@/lib/api/tables"

interface TableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: RestaurantTable | null
  onSave: (table: RestaurantTable) => void
  existingTables?: RestaurantTable[]
}

export default function TableDialog({ open, onOpenChange, table, onSave, existingTables = [] }: TableDialogProps) {
  const [formData, setFormData] = useState<{
    tableNumber: string
    capacity: string
    location: "indoor" | "outdoor" | "terrace" | "bar"
    status: "available" | "occupied" | "reserved" | "maintenance"
  }>({
    tableNumber: "",
    capacity: "",
    location: "indoor",
    status: "available",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (table) {
      setFormData({
        tableNumber: table.tableNumber || "",
        capacity: table.capacity?.toString() || "",
        location: table.location || "indoor",
        status: table.status || "available",
      })
    } else {
      setFormData({
        tableNumber: "",
        capacity: "",
        location: "indoor",
        status: "available",
      })
    }
    setErrors({})
  }, [table, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = "Numero de mesa es obligatorio"
    } else {
      const isDuplicate = existingTables.some(
        (t) => t.tableNumber.toLowerCase() === formData.tableNumber.trim().toLowerCase() && t.id !== table?.id,
      )
      if (isDuplicate) {
        newErrors.tableNumber = `Mesa numero "${formData.tableNumber}" ya existe`
      }
    }

    if (!formData.capacity || Number.parseInt(formData.capacity) < 1) {
      newErrors.capacity = "Capacidad minima es 1 invitado"
    } else if (Number.parseInt(formData.capacity) > 20) {
      newErrors.capacity = "Capacidad maxima es 20 invitados"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const tableData: RestaurantTable = {
      ...(table?.id ? { id: table.id } : {}),
      tableNumber: formData.tableNumber,
      capacity: Number.parseInt(formData.capacity),
      location: formData.location,
      status: formData.status,
      isDeleted: false,
    }

    onSave(tableData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{table ? "Editar Mesa" : "Añadir Mesa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">
                Numero de Mesa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tableNumber"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                placeholder="T1"
                className={errors.tableNumber ? "border-destructive" : ""}
              />
              {errors.tableNumber && <p className="text-sm text-destructive">{errors.tableNumber}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">
                Capacidad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="20"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className={errors.capacity ? "border-destructive" : ""}
              />
              {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Locación</Label>
              <Select
                value={formData.location}
                onValueChange={(value: "indoor" | "outdoor" | "terrace" | "bar") =>
                  setFormData({ ...formData, location: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indoor">Adentro</SelectItem>
                  <SelectItem value="outdoor">Fuera</SelectItem>
                  <SelectItem value="terrace">Terraza</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "available" | "occupied" | "reserved" | "maintenance") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="occupied">Ocupado</SelectItem>
                  <SelectItem value="reserved">Rerservado</SelectItem>
                  <SelectItem value="maintenance">En mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
            >
              {table ? "Actualizar" : "Añadir"} Mesa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
