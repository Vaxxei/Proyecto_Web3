import express from "express"
import { register, login, getCurrentUser } from "../controllers/authController.js"
import { registerValidation, loginValidation } from "../utils/validators.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

router.post("/register", registerValidation, register)
router.post("/login", loginValidation, login)

router.get("/me", authenticate, getCurrentUser)

export default router
