import apiClient from "./axios"

export interface User {
  id?: number
  name: string
  fullName?: string
  email: string
  password?: string
  role: "admin" | "manager" | "staff"
  status: "active" | "inactive"
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

const transformUserData = (user: any): User => {
  return {
    id: user.id,
    name: user.name,
    fullName: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isDeleted: user.deleted_at !== null && user.deleted_at !== undefined,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt,
  }
}

const transformUserToBackend = (user: Partial<User>): any => {
  const backendData: any = {}

  if (user.fullName || user.name) {
    backendData.name = user.fullName || user.name
  }
  if (user.email) backendData.email = user.email
  if (user.password) backendData.password = user.password
  if (user.role) backendData.role = user.role
  if (user.status) backendData.status = user.status

  return backendData
}

export const usersAPI = {
  async getAll(): Promise<User[]> {
    try {
      const response = await apiClient.get("/users")
      console.log("[v0] Users API response:", response.data)
      const users = response.data.data || []
      return users.map(transformUserData)
    } catch (error) {
      console.error("[v0] Get users error:", error)
      return []
    }
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get(`/users/${id}`)
    return transformUserData(response.data.data)
  },
  async create(data: User): Promise<User> {
    console.log("[v0] Creating user with data:", data)
    const backendData = transformUserToBackend(data)
    if (!backendData.password) {
      backendData.password = "Welcome@123"
    }
    console.log("[v0] Sending to backend:", backendData)
    const response = await apiClient.post("/users", backendData)
    return transformUserData(response.data.data)
  },
  async update(id: number | string, data: Partial<User>): Promise<User> {
    console.log("[v0] Updating user:", id, data)
    const backendData = transformUserToBackend(data)
    const response = await apiClient.put(`/users/${id}`, backendData)
    return transformUserData(response.data.data)
  },
  async delete(id: number | string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
