import express from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { testConnection } from "./config/database.js"

import authRoutes from "./routes/authRoutes.js"
import reservationRoutes from "./routes/reservationRoutes.js"
import tableRoutes from "./routes/tableRoutes.js"
import userRoutes from "./routes/userRoutes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Servidor corriendo",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/tables", tableRoutes)
app.use("/api/users", userRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  })
})

app.use((err, req, res, next) => {
  console.error("Error:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

const startServer = async () => {
  try {
    await testConnection()

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
      console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`)
      console.log(`CORS habilitado para: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
    })
  } catch (error) {
    console.error("Fallo al iniciar servidor:", error)
    process.exit(1)
  }
}

startServer()
