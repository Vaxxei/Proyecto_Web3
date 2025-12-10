"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Pencil, Trash2, Shield } from "lucide-react"
import UserDialog from "@/components/users/user-dialog"
import DeleteConfirmDialog from "@/components/shared/delete-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { usersAPI } from "@/lib/api/users"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  fullName: string
  name?: string
  email: string
  role: "admin" | "manager" | "staff"
  status: "active" | "inactive"
  createdAt: string
  isDeleted: boolean
}

export default function UsersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  useEffect(() => {
    console.log("[v0] usersAPI available:", !!usersAPI, usersAPI)
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching users from API...")
      const data = await usersAPI.getAll()
      console.log("[v0] Users loaded (raw):", data)
      const arr = Array.isArray(data) ? data : []
      setUsers(arr)
      return arr
    } catch (error: any) {
      console.error("[v0] Failed to load users:", error)
      toast({
        title: "Error",
        description: (error?.response?.data?.message as string) || error?.message || "Fallo al cargar usuarios.",
        variant: "destructive",
      })
      setUsers([])
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = (users || []).filter(
    (user) =>
      !user.isDeleted &&
      ((user.fullName || user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleCreate = () => {
    console.log("[v0] Opening create user dialog")
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    console.log("[v0] Opening edit dialog for user:", user)
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    console.log("[v0] Delete button clicked for user:", user.id)
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) {
      console.warn("[v0] handleDelete called but no userToDelete set")
      return
    }

    try {
      console.log("[v0] Calling usersAPI.delete for id:", userToDelete.id)
      const res = await usersAPI.delete(userToDelete.id)
      console.log("[v0] Delete response:", res)
      toast({
        title: "Exito",
        description: "Usuario eliminado exitosamente",
      })
      await loadUsers()
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error("[v0] Failed to delete user:", error)
      toast({
        title: "Error",
        description: (error?.response?.data?.message as string) || error?.message || "Fallo al eliminar al usuario.",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (user: User) => {
    try {
      if (selectedUser) {
        console.log("[v0] Updating user via usersAPI.update:", user)
        const res = await usersAPI.update(user.id, user)
        console.log("[v0] Update response:", res)
        toast({
          title: "Exito",
          description: "Usuario actualizado exitosamente",
        })
      } else {
        console.log("[v0] Creating user via usersAPI.create:", user)
        const res = await usersAPI.create(user)
        console.log("[v0] Create response:", res)
        toast({
          title: "Exito",
          description: "Usuario creado exitosamente",
        })
      }
      await loadUsers()
      setDialogOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      console.error("[v0] Failed to save user:", error)
      toast({
        title: "Error",
        description: (error?.response?.data?.message as string) || error?.message || "Fallo al guardar al usuario.",
        variant: "destructive",
      })
    }
  }

  const getRoleBadge = (role: User["role"]) => {
    const variants = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      staff: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }
    return (
      <Badge className={`${(variants as any)[role]} flex items-center gap-1 w-fit`}>
        <Shield className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: User["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    }
    return <Badge className={(variants as any)[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const getPermissions = (role: User["role"]) => {
    const permissions: Record<string, string[]> = {
      admin: ["Todos los permisos", "Gestion de Usuarios", "Reportes"],
      manager: ["Ver reservaciones", "Ver mesas", "Ver reportes", "Ver usuarios"],
      staff: ["Ver reservaciones", "Ver mesas", "Ver reportes"],
    }
    return permissions[role] ?? []
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
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground mt-2">Gestionar usuarios</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir Usuario
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No se encontraron usuarios </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-card border border-border rounded-lg p-6 space-y-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(user.fullName || user.name || "U")
                      .split(" ")
                      .map((n) => n[0] || "")
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{user.fullName || user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se unio: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(user)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.status)}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Permisos:</p>
                <div className="flex flex-wrap gap-2">
                  {getPermissions(user.role).map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={selectedUser} onSave={handleSave} />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Eliminar usuario"
        description="Estas seguro de que quieres eliminar este usuario?"
      />
    </div>
  )
}
