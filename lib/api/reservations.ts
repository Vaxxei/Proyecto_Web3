import apiClient from "./axios"

export interface Reservation {
  id?: number
  customerName: string
  customerEmail: string
  customerPhone: string
  date: string
  time: string
  guests: number
  tableId?: number
  tableNumber?: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  specialRequests?: string
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ReservationStats {
  total: number
  today: number
  confirmed: number
  pending: number
}

const transformReservationData = (reservation: any): Reservation => {
  return {
    id: reservation.id,
    customerName: reservation.customer_name || reservation.customerName,
    customerEmail: reservation.customer_email || reservation.customerEmail,
    customerPhone: reservation.customer_phone || reservation.customerPhone,
    date: reservation.reservation_date || reservation.date,
    time: reservation.reservation_time || reservation.time,
    guests: reservation.guests,
    tableId: reservation.table_id || reservation.tableId,
    tableNumber: reservation.table_number || reservation.tableNumber,
    status: reservation.status,
    specialRequests: reservation.special_requests || reservation.specialRequests,
    isDeleted: reservation.deleted_at !== null && reservation.deleted_at !== undefined,
    createdAt: reservation.created_at || reservation.createdAt,
    updatedAt: reservation.updated_at || reservation.updatedAt,
  }
}
function formatTime(time: string | undefined): string {
  if (!time) return ""

  const timeStr = String(time).trim()

  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr.substring(0, 5)
  }

  return timeStr
}

const transformToApiFormat = (data: Partial<Reservation>): any => {
  const apiData: any = {}

  if (data.customerName && String(data.customerName).trim()) {
    apiData.customer_name = String(data.customerName).trim()
  }

  if (data.customerEmail && String(data.customerEmail).trim()) {
    apiData.customer_email = String(data.customerEmail).trim()
  }

  if (data.customerPhone && String(data.customerPhone).trim()) {
    apiData.customer_phone = String(data.customerPhone).trim()
  }

  if (data.date && String(data.date).trim()) {
    apiData.reservation_date = String(data.date).trim()
  }

  if (data.time) {
    const formattedTime = formatTime(data.time)
    if (formattedTime && /^\d{2}:\d{2}$/.test(formattedTime)) {
      apiData.reservation_time = formattedTime
    }
  }

  if (data.guests !== undefined && data.guests !== null) {
    apiData.guests = Number(data.guests)
  }

  if (data.tableId !== undefined && data.tableId !== null) {
    apiData.table_id = Number(data.tableId)
  }

  if (data.status && String(data.status).trim()) {
    apiData.status = String(data.status).trim()
  }

  if (data.specialRequests !== undefined) {
    apiData.special_requests = data.specialRequests ? String(data.specialRequests).trim() : null
  }

  console.log("[v0] ========== TRANSFORM RESERVATION DATA ==========")
  console.log("[v0] Input data:", JSON.stringify(data, null, 2))
  console.log("[v0] API data:", JSON.stringify(apiData, null, 2))
  console.log("[v0] ========== TRANSFORM END ==========")

  return apiData
}

export const reservationsAPI = {
  async getAll(): Promise<Reservation[]> {
    const response = await apiClient.get("/reservations")
    const reservations = response.data.data || []
    return reservations.map(transformReservationData)
  },

  async getById(id: number): Promise<Reservation> {
    const response = await apiClient.get(`/reservations/${id}`)
    return transformReservationData(response.data.data)
  },

  async create(data: Reservation): Promise<Reservation> {
    const apiData = transformToApiFormat(data)
    const response = await apiClient.post("/reservations", apiData)
    return transformReservationData(response.data.data)
  },

  async update(id: number | string, data: Partial<Reservation>): Promise<Reservation> {
    console.log("[v0] ========== UPDATE RESERVATION START ==========")
    console.log("[v0] Reservation ID:", id)
    console.log("[v0] Input data:", JSON.stringify(data, null, 2))

    const apiData = transformToApiFormat(data)

    console.log("[v0] Sending PUT request to:", `/reservations/${id}`)
    console.log("[v0] Request payload:", JSON.stringify(apiData, null, 2))

    try {
      const response = await apiClient.put(`/reservations/${id}`, apiData)
      console.log("[v0] Update successful! Response:", response.data)
      console.log("[v0] ========== UPDATE RESERVATION END ==========")
      return transformReservationData(response.data.data)
    } catch (error: any) {
      console.error("[v0] ========== UPDATE RESERVATION ERROR ==========")
      console.error("[v0] Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        validationErrors: error.response?.data?.errors,
      })
      console.error("[v0] ========== UPDATE RESERVATION ERROR END ==========")
      throw error
    }
  },

  async delete(id: number | string): Promise<void> {
    await apiClient.delete(`/reservations/${id}`)
  },

  async getStats(): Promise<ReservationStats> {
    const response = await apiClient.get("/reservations/stats")
    return response.data.data
  },

  async search(query: string): Promise<Reservation[]> {
    const response = await apiClient.get("/reservations", {
      params: { search: query },
    })
    const reservations = response.data.data || []
    return reservations.map(transformReservationData)
  },
  async filterByStatus(status: string): Promise<Reservation[]> {
    const response = await apiClient.get("/reservations", {
      params: { status },
    })
    const reservations = response.data.data || []
    return reservations.map(transformReservationData)
  },
}
