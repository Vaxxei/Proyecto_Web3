"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import TableDialog from "@/components/tables/table-dialog"
import DeleteConfirmDialog from "@/components/shared/delete-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { tablesAPI, type RestaurantTable } from "@/lib/api/tables"
import { useToast } from "@/hooks/use-toast"

export default function TablesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<RestaurantTable[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null)

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      setLoading(true)
      const data = await tablesAPI.getAll()
      setTables(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar las mesas.",
        variant: "destructive",
      })
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTables = (tables || []).filter(
    (table) =>
      !table.isDeleted &&
      table.tableNumber &&
      table.location &&
      (table.tableNumber.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.location.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleCreate = () => {
    setSelectedTable(null)
    setDialogOpen(true)
  }

  const handleEdit = (table: RestaurantTable) => {
    setSelectedTable(table)
    setDialogOpen(true)
  }

  const handleDeleteClick = (table: RestaurantTable) => {
    setTableToDelete(table)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (tableToDelete && tableToDelete.id) {
      try {
        await tablesAPI.delete(tableToDelete.id)

        toast({
          title: "Exito",
          description: "Mesa eliminada con exito",
        })

        await loadTables()
        setDeleteDialogOpen(false)
        setTableToDelete(null)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Fallo al eliminar la mesa.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSave = async (table: RestaurantTable) => {
    try {
      if (selectedTable && selectedTable.id) {
        await tablesAPI.update(selectedTable.id, table)
        toast({ title: "Exito", description: "Mesa actualizada" })
      } else {
        await tablesAPI.create(table)
        toast({ title: "Exito", description: "Mesa creada" })
      }
      await loadTables()
      setDialogOpen(false)
    } catch (error: any) {
      let errorMessage = "Fallo al guardar la mesa."

      if (error.response?.data?.message === "Numero de Mesa ya existe") {
        errorMessage = `Numero de mesa "${table.tableNumber}" ya existe por favor elija otro.`
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: RestaurantTable["status"]) => {
    const variants = {
      available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      occupied: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      reserved: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      maintenance: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return <Badge className={variants[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const getLocationBadge = (location: RestaurantTable["location"]) => {
    const variants = {
      indoor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      outdoor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      terrace: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      bar: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    }
    return <Badge className={variants[location]}>{location.charAt(0).toUpperCase() + location.slice(1)}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">cargando ...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mesas</h1>
          <p className="text-muted-foreground mt-2">Gestionar las mesas</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir mesas
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron mesas</div>
        ) : (
          filteredTables.map((table) => (
            <div
              key={table.id}
              className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Mesa {table.tableNumber}</h3>
                  <p className="text-sm text-muted-foreground">{table.capacity} invitados</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(table)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(table)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(table.status)}
                  {getLocationBadge(table.location)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <TableDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        table={selectedTable}
        onSave={handleSave}
        existingTables={tables}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Eliminar mesa"
        description="Estas seguro de que quieres eliminar esta mesa?"
      />
    </div>
  )
}
