import { pool } from "../config/database.js"
import { validationResult } from "express-validator"

export const getTables = async (req, res) => {
  try {
    const { status, location } = req.query

    let query = "SELECT * FROM restaurant_tables WHERE deleted_at IS NULL"
    const params = []

    if (status) {
      query += " AND status = ?"
      params.push(status)
    }

    if (location) {
      query += " AND location = ?"
      params.push(location)
    }

    query += " ORDER BY table_number"

    const [tables] = await pool.query(query, params)

    res.status(200).json({
      success: true,
      data: tables,
      count: tables.length,
    })
  } catch (error) {
    console.error("Get tables error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch tables",
      error: error.message,
    })
  }
}

export const getTable = async (req, res) => {
  try {
    const { id } = req.params

    const [tables] = await pool.query("SELECT * FROM restaurant_tables WHERE id = ? AND deleted_at IS NULL", [id])

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      })
    }

    res.status(200).json({
      success: true,
      data: tables[0],
    })
  } catch (error) {
    console.error("Get table error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch table",
      error: error.message,
    })
  }
}

export const createTable = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const { table_number, capacity, location, status = "available" } = req.body

    const [existingTables] = await pool.query(
      "SELECT id FROM restaurant_tables WHERE table_number = ? AND deleted_at IS NULL",
      [table_number],
    )

    if (existingTables.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Table number already exists",
      })
    }

    const [result] = await pool.query(
      "INSERT INTO restaurant_tables (table_number, capacity, location, status) VALUES (?, ?, ?, ?)",
      [table_number, capacity, location, status],
    )

    const [newTable] = await pool.query("SELECT * FROM restaurant_tables WHERE id = ?", [result.insertId])

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: newTable[0],
    })
  } catch (error) {
    console.error("Create table error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create table",
      error: error.message,
    })
  }
}

export const updateTable = async (req, res) => {
  try {
    const { id } = req.params
    const errors = validationResult(req)

    console.log("[v0] Update table request:", { id, body: req.body })

    if (!errors.isEmpty()) {
      console.log("[v0] Validation errors:", errors.array())
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const [tables] = await pool.query("SELECT * FROM restaurant_tables WHERE id = ? AND deleted_at IS NULL", [id])

    if (tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      })
    }

    const updateData = req.body

    console.log("[v0] Update data:", updateData)

    if (updateData.table_number && updateData.table_number !== tables[0].table_number) {
      const [existingTables] = await pool.query(
        "SELECT id FROM restaurant_tables WHERE table_number = ? AND id != ? AND deleted_at IS NULL",
        [updateData.table_number, id],
      )

      if (existingTables.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Table number already exists",
        })
      }
    }

    const fields = []
    const values = []

    const allowedFields = ["table_number", "capacity", "location", "status"]

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

    const query = `UPDATE restaurant_tables SET ${fields.join(", ")} WHERE id = ?`
    console.log("[v0] SQL update query:", query)
    console.log("[v0] SQL values:", values)

    try {
      const [result] = await pool.query(query, values)
      console.log("[v0] SQL result:", result)
    } catch (sqlError) {
      console.error("[v0] SQL Error:", sqlError)
      return res.status(500).json({
        success: false,
        message: "Database error during update",
        error: sqlError.message,
        query: query,
        values: values,
      })
    }

    const [updatedTable] = await pool.query("SELECT * FROM restaurant_tables WHERE id = ?", [id])

    console.log("[v0] Table updated successfully:", updatedTable[0])

    res.status(200).json({
      success: true,
      message: "Table updated successfully",
      data: updatedTable[0],
    })
  } catch (error) {
    console.error("[v0] Update table error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update table",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params

    console.log("[v0] ========== DELETE TABLE START ==========")
    console.log("[v0] Delete table request - ID:", id)

    const [tables] = await pool.query("SELECT * FROM restaurant_tables WHERE id = ? AND deleted_at IS NULL", [id])

    console.log("[v0] Table lookup result:", tables.length > 0 ? "Found" : "Not found")

    if (tables.length === 0) {
      console.log("[v0] Table not found or already deleted")
      return res.status(404).json({
        success: false,
        message: "Table not found",
      })
    }

    console.log("[v0] Table found:", tables[0])

    const [activeReservations] = await pool.query(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE table_id = ? AND status IN ('pending', 'confirmed') AND deleted_at IS NULL`,
      [id],
    )

    console.log("[v0] Active reservations count:", activeReservations[0].count)

    if (activeReservations[0].count > 0) {
      console.log("[v0] Cannot delete - table has active reservations")
      return res.status(400).json({
        success: false,
        message: "Cannot delete table with active reservations",
      })
    }

    const deleteQuery = "UPDATE restaurant_tables SET deleted_at = NOW() WHERE id = ?"
    console.log("[v0] Executing delete query:", deleteQuery)
    console.log("[v0] Delete parameters:", [id])

    const [result] = await pool.query(deleteQuery, [id])

    console.log("[v0] Delete query result:", result)
    console.log("[v0] Affected rows:", result.affectedRows)

    if (result.affectedRows === 0) {
      console.log("[v0] No rows affected - delete may have failed")
      return res.status(500).json({
        success: false,
        message: "Failed to delete table - no rows affected",
      })
    }

    const [verifyResult] = await pool.query("SELECT deleted_at FROM restaurant_tables WHERE id = ?", [id])
    console.log("[v0] Verification - deleted_at value:", verifyResult[0]?.deleted_at)

    console.log("[v0] Table deleted successfully - ID:", id)
    console.log("[v0] ========== DELETE TABLE END ==========")

    res.status(200).json({
      success: true,
      message: "Table deleted successfully",
      deletedAt: verifyResult[0]?.deleted_at,
    })
  } catch (error) {
    console.error("[v0] ========== DELETE TABLE ERROR ==========")
    console.error("[v0] Delete table error:", error)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] ========== DELETE TABLE ERROR END ==========")
    res.status(500).json({
      success: false,
      message: "Failed to delete table",
      error: error.message,
    })
  }
}

export const getTableStats = async (req, res) => {
  try {
    const [totalCount] = await pool.query("SELECT COUNT(*) as count FROM restaurant_tables WHERE deleted_at IS NULL")

    const [availableCount] = await pool.query(
      "SELECT COUNT(*) as count FROM restaurant_tables WHERE status = ? AND deleted_at IS NULL",
      ["available"],
    )

    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM restaurant_tables 
       WHERE deleted_at IS NULL 
       GROUP BY status`,
    )

    res.status(200).json({
      success: true,
      data: {
        total: totalCount[0].count,
        available: availableCount[0].count,
        byStatus: statusCounts,
      },
    })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    })
  }
}
