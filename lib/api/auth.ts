import apiClient from "./axios"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role?: "admin" | "manager" | "staff"
}

export interface User {
  id: number
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  status: "active" | "inactive"
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export const authAPI = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/login", credentials)
    return {
      user: response.data.data.user,
      token: response.data.data.token,
    }
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post("/auth/register", data)
    return {
      user: response.data.data.user,
      token: response.data.data.token,
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get("/auth/me")
    return response.data.data.user
  },

  // Validate password strength
  validatePasswordStrength(password: string): "weak" | "medium" | "strong" {
    if (password.length < 6) return "weak"

    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    if (strength <= 1) return "weak"
    if (strength <= 3) return "medium"
    return "strong"
  },
}
