import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("[v0] Added token to request:", config.url)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)
apiClient.interceptors.response.use(
  (response) => {
    console.log("[v0] API Response:", response.config.url, response.status)
    return response
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    }

    console.error("[v0] API Error Details:", errorDetails)

    if (error.response?.data?.message) {
      console.error("[v0] Backend Error Message:", error.response.data.message)
    }

    if (error.response?.data?.error) {
      console.error("[v0] Backend Error Details:", error.response.data.error)
    }

    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      console.error("[v0] Validation Errors:")
      error.response.data.errors.forEach((err: any) => {
        console.error(`  - Field: ${err.path || err.param}, Message: ${err.msg}`)
      })
    }

    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      const hasToken = localStorage.getItem("token")

      if (hasToken && currentPath !== "/login" && currentPath !== "/register") {
        console.log("[v0] 401 error with valid token, clearing and redirecting")
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
