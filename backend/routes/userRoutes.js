import express from "express"
import { getUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/userController.js"
import { userValidation, userUpdateValidation } from "../utils/validators.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

router.use(authenticate)
router.use(authorize("admin"))

router.get("/", getUsers)
router.get("/:id", getUser)
router.post("/", userValidation, createUser)
router.put("/:id", userUpdateValidation, updateUser)
router.delete("/:id", deleteUser)

export default router
