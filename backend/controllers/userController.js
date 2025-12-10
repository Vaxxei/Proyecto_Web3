import bcrypt from "bcryptjs"
import { pool } from "../config/database.js"
import { validationResult } from "express-validator"

export const getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query

    let query = "SELECT id, name, email, role, status, created_at FROM users WHERE deleted_at IS NULL"
    const params = []

    if (role) {
      query += " AND role = ?"
      params.push(role)
    }

    if (status) {
      query += " AND status = ?"
      params.push(status)
    }

    if (search) {
      query += " AND (name LIKE ? OR email LIKE ?)"
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    query += " ORDER BY created_at DESC"

    const [users] = await pool.query(query, params)

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    })
  }
}

export const getUser = async (req, res) => {
  try {
    const { id } = req.params

    const [users] = await pool.query(
      "SELECT id, name, email, role, status, created_at FROM users WHERE id = ? AND deleted_at IS NULL",
      [id],
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      data: users[0],
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    })
  }
}
export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { name, email, password, role, status = "active" } = req.body

    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ? AND deleted_at IS NULL", [email])

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      })
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, role, status],
    )

    const [newUser] = await pool.query("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?", [
      result.insertId,
    ])

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser[0],
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const errors = validationResult(req)

    console.log("[v0] Update user request:", { id, body: req.body })

    if (!errors.isEmpty()) {
      console.log("[v0] Validation errors:", errors.array())
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const [users] = await pool.query("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL", [id])

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const updateData = req.body

    console.log("[v0] Update data:", updateData)

    if (updateData.email && updateData.email !== users[0].email) {
      const [existingUsers] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL",
        [updateData.email, id],
      )

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        })
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10)
    }

    const fields = []
    const values = []

    const allowedFields = ["name", "email", "password", "role", "status"]

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined && allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(updateData[key])
      }
    })

    if (fields.length === 0) {
      console.log("[v0] No valid fields to update")
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      })
    }

    values.push(id)

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`
    console.log("[v0] SQL update query:", query)
    console.log("[v0] SQL values:", values)

    const [result] = await pool.query(query, values)
    console.log("[v0] SQL result:", result)

    const [updatedUser] = await pool.query("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?", [
      id,
    ])

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser[0],
    })
  } catch (error) {
    console.error("[v0] Update user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    console.log("[v0] Delete user request:", { id, requestUserId: req.user.id })

    if (Number.parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      })
    }

    const [users] = await pool.query("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL", [id])

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    await pool.query("UPDATE users SET deleted_at = NOW() WHERE id = ?", [id])

    console.log("[v0] User deleted successfully:", id)

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    })
  }
}
