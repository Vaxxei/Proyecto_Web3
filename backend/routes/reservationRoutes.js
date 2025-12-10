import express from "express"
import {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  getReservationStats,
} from "../controllers/reservationController.js"
import { reservationValidation, reservationUpdateValidation } from "../utils/validators.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

router.use(authenticate)

router.get("/stats", getReservationStats)

router.get("/", getReservations)
router.get("/:id", getReservation)
router.post("/", reservationValidation, authorize("admin", "manager", "staff"), createReservation)
router.put("/:id", reservationUpdateValidation, authorize("admin", "manager"), updateReservation)
router.delete("/:id", authorize("admin", "manager"), deleteReservation)

export default router
