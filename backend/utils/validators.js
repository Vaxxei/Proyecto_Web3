import { body } from "express-validator"

export const registerValidation = [
  body("name").trim().isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
]

export const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
]

export const reservationValidation = [
  body("customer_name").trim().isLength({ min: 3 }).withMessage("Customer name must be at least 3 characters long"),
  body("customer_email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("customer_phone").trim().isLength({ min: 10 }).withMessage("Phone number must be at least 10 digits"),
  body("reservation_date").isISO8601().withMessage("Invalid date format"),
  body("reservation_time")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Invalid time format (HH:MM)"),
  body("guests").isInt({ min: 1, max: 20 }).withMessage("Number of guests must be between 1 and 20"),
]

export const reservationUpdateValidation = [
  body("customer_name")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Customer name must be at least 3 characters long"),
  body("customer_email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("customer_phone").optional().trim().isLength({ min: 10 }).withMessage("Phone number must be at least 10 digits"),
  body("reservation_date")
    .optional()
    .custom((value) => {
      if (!value) return true
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(value)) {
        throw new Error("Invalid date format (expected YYYY-MM-DD)")
      }
      return true
    }),
  body("reservation_time")
    .optional()
    .custom((value) => {
      if (!value) return true
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(value)) {
        throw new Error("Invalid time format (expected HH:MM)")
      }
      return true
    }),
  body("guests").optional().isInt({ min: 1, max: 20 }).withMessage("Number of guests must be between 1 and 20"),
  body("status")
    .optional()
    .isIn(["pending", "confirmed", "completed", "cancelled"])
    .withMessage("Invalid status (must be: pending, confirmed, completed, or cancelled)"),
  body("table_id")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true
      const numValue = Number(value)
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error("table_id must be a positive number or null")
      }
      return true
    }),
  body("special_requests").optional({ nullable: true }).isString().withMessage("Special requests must be a string"),
]

export const tableValidation = [
  body("table_number").trim().notEmpty().withMessage("Table number is required"),
  body("capacity").isInt({ min: 1, max: 50 }).withMessage("Capacity must be between 1 and 50"),
  body("location").isIn(["indoor", "outdoor", "terrace", "bar"]).withMessage("Invalid location"),
]

export const tableUpdateValidation = [
  body("table_number").optional().trim().notEmpty().withMessage("Table number is required"),
  body("capacity").optional().isInt({ min: 1, max: 50 }).withMessage("Capacity must be between 1 and 50"),
  body("location").optional().isIn(["indoor", "outdoor", "terrace", "bar"]).withMessage("Invalid location"),
  body("status").optional().isIn(["available", "occupied", "reserved", "maintenance"]).withMessage("Invalid status"),
]

export const userValidation = [
  body("name").trim().isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("role").isIn(["admin", "manager", "staff"]).withMessage("Invalid role"),
]

export const userUpdateValidation = [
  body("name").optional().trim().isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("role").optional().isIn(["admin", "manager", "staff"]).withMessage("Invalid role"),
  body("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status"),
]
