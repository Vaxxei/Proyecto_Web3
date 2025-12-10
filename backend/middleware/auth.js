import jwt from "jsonwebtoken"
import { pool } from "../config/database.js"

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const [users] = await pool.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ? AND deleted_at IS NULL",
      [decoded.userId],
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado.",
      })
    }

    const user = users[0]

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Cuenta inactiva.",
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalido.",
      })
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado.",
      })
    }
    return res.status(500).json({
      success: false,
      message: "Autenticacion error.",
      error: error.message,
    })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Autenticacion requerida.",
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado.",
      })
    }

    next()
  }
}
