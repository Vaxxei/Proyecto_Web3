import apiClient from "./axios"

export interface RestaurantTable {
  id?: number
  tableNumber: string
  capacity: number
  location: "indoor" | "outdoor" | "terrace" | "bar"
  status: "available" | "occupied" | "reserved" | "maintenance"
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface TableStats {
  total: number
  available: number
  occupied: number
  reserved: number
}

const transformTableData = (table: any): RestaurantTable => {
  return {
    id: table.id,
    tableNumber: table.table_number || table.tableNumber,
    capacity: table.capacity,
    location: table.location,
    status: table.status,
    isDeleted: table.deleted_at !== null && table.deleted_at !== undefined,
    createdAt: table.created_at || table.createdAt,
    updatedAt: table.updated_at || table.updatedAt,
  }
}

const transformToApiFormat = (data: Partial<RestaurantTable>): any => {
  const apiData: any = {}

  console.log("[v0] Input data to transform:", JSON.stringify(data, null, 2))

  if (data.tableNumber !== undefined && data.tableNumber !== null && data.tableNumber !== "") {
    apiData.table_number = String(data.tableNumber).trim()
    console.log("[v0] Added table_number:", apiData.table_number)
  }

  if (data.capacity !== undefined && data.capacity !== null) {
    apiData.capacity = Number(data.capacity)
    console.log("[v0] Added capacity:", apiData.capacity)
  }

  if (data.location !== undefined && data.location !== null) {
    apiData.location = data.location
    console.log("[v0] Added location:", apiData.location)
  }

  if (data.status !== undefined && data.status !== null) {
    apiData.status = data.status
    console.log("[v0] Added status:", apiData.status)
  }

  console.log("[v0] Final API payload:", JSON.stringify(apiData, null, 2))
  return apiData
}

export const tablesAPI = {
  async getAll(): Promise<RestaurantTable[]> {
    console.log("[v0] Fetching all tables...")
    const response = await apiClient.get("/tables")
    console.log("[v0] Tables response:", response.data)
    const tables = response.data.data || []
    console.log("[v0] Transforming tables:", tables.length)
    return tables.map(transformTableData)
  },

  async getById(id: number): Promise<RestaurantTable> {
    const response = await apiClient.get(`/tables/${id}`)
    return transformTableData(response.data.data)
  },

  async create(data: RestaurantTable): Promise<RestaurantTable> {
    console.log("[v0] Creating table with data:", data)
    const apiData = transformToApiFormat(data)
    console.log("[v0] Sending to API:", apiData)
    const response = await apiClient.post("/tables", apiData)
    return transformTableData(response.data.data)
  },

  async update(id: number | string, data: Partial<RestaurantTable>): Promise<RestaurantTable> {
    console.log("[v0] ========== UPDATE TABLE START ==========")
    console.log("[v0] Table ID:", id)
    console.log("[v0] Raw update data:", JSON.stringify(data, null, 2))

    const apiData = transformToApiFormat(data)

    console.log("[v0] Transformed API data:", JSON.stringify(apiData, null, 2))
    console.log("[v0] API endpoint:", `/tables/${id}`)
    console.log("[v0] Request method: PUT")

    try {
      const response = await apiClient.put(`/tables/${id}`, apiData)
      console.log("[v0] Update successful! Response:", response.data)
      console.log("[v0] ========== UPDATE TABLE END ==========")
      return transformTableData(response.data.data)
    } catch (error: any) {
      console.error("[v0] ========== UPDATE TABLE ERROR ==========")
      console.error("[v0] Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      })
      console.error("[v0] ========== UPDATE TABLE ERROR END ==========")
      throw error
    }
  },

  async delete(id: number | string): Promise<void> {
    console.log("[v0] ========== DELETE TABLE START ==========")
    console.log("[v0] Deleting table ID:", id)
    console.log("[v0] DELETE endpoint:", `/tables/${id}`)

    try {
      const response = await apiClient.delete(`/tables/${id}`)
      console.log("[v0] Delete response:", response.data)
      console.log("[v0] Delete successful - table marked as deleted in database")
      console.log("[v0] ========== DELETE TABLE END ==========")
    } catch (error: any) {
      console.error("[v0] ========== DELETE TABLE ERROR ==========")
      console.error("[v0] Delete error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      })
      console.error("[v0] ========== DELETE TABLE ERROR END ==========")
      throw error
    }
  },

  async getStats(): Promise<TableStats> {
    const response = await apiClient.get("/tables/stats")
    return response.data.data
  },

  async getAvailable(): Promise<RestaurantTable[]> {
    const response = await apiClient.get("/tables", {
      params: { status: "available" },
    })
    const tables = response.data.data || []
    return tables.map(transformTableData)
  },
}
