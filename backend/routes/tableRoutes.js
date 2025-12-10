import express from "express"
import {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  getTableStats,
} from "../controllers/tableController.js"
import { tableValidation, tableUpdateValidation } from "../utils/validators.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

router.use(authenticate)

router.get("/stats", getTableStats)

router.get("/", getTables)
router.get("/:id", getTable)
router.post("/", tableValidation, authorize("admin", "manager"), createTable)
router.put("/:id", tableUpdateValidation, authorize("admin", "manager"), updateTable)
router.delete("/:id", authorize("admin"), deleteTable)

export default router
