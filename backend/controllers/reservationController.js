import { pool } from "../config/database.js"
import { validationResult } from "express-validator"

export const getReservations = async (req, res) => {
  try {
    const { status, date, search } = req.query

    let query = `
      SELECT r.*, rt.table_number, u.name as created_by_name
      FROM reservations r
      LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.deleted_at IS NULL
    `
    const params = []

    if (status) {
      query += " AND r.status = ?"
      params.push(status)
    }

    if (date) {
      query += " AND r.reservation_date = ?"
      params.push(date)
    }

    if (search) {
      query += " AND (r.customer_name LIKE ? OR r.customer_email LIKE ? OR r.customer_phone LIKE ?)"
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    query += " ORDER BY r.reservation_date DESC, r.reservation_time DESC"

    const [reservations] = await pool.query(query, params)

    res.status(200).json({
      success: true,
      data: reservations,
      count: reservations.length,
    })
  } catch (error) {
    console.error("Get reservations error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch reservations",
      error: error.message,
    })
  }
}

export const getReservation = async (req, res) => {
  try {
    const { id } = req.params

    const [reservations] = await pool.query(
      `SELECT r.*, rt.table_number, u.name as created_by_name
       FROM reservations r
       LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [id],
    )

    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      })
    }

    res.status(200).json({
      success: true,
      data: reservations[0],
    })
  } catch (error) {
    console.error("Get reservation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch reservation",
      error: error.message,
    })
  }
}

export const createReservation = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      reservation_time,
      guests,
      table_id,
      special_requests,
      status = "pending",
    } = req.body

    console.log("[v0] Create reservation request:", req.body)

    if (table_id) {
      const [tables] = await pool.query("SELECT * FROM restaurant_tables WHERE id = ? AND deleted_at IS NULL", [
        table_id,
      ])

      if (tables.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Table not found",
        })
      }
      if ((status === "pending" || status === "confirmed") && tables[0].status !== "available") {
        return res.status(400).json({
          success: false,
          message: "Table is not available",
          details: `Table status: ${tables[0].status}`,
        })
      }
    }

    const [result] = await pool.query(
      `INSERT INTO reservations 
       (customer_name, customer_email, customer_phone, reservation_date, reservation_time, 
        guests, table_id, special_requests, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        customer_email,
        customer_phone,
        reservation_date,
        reservation_time,
        guests,
        table_id || null,
        special_requests || null,
        status,
        req.user.id,
      ],
    )

    console.log("[v0] Reservation created with ID:", result.insertId)

    if (table_id && status === "confirmed") {
      await pool.query("UPDATE restaurant_tables SET status = ? WHERE id = ?", ["reserved", table_id])
      console.log("[v0] Table status updated to reserved")
    }

    const [newReservation] = await pool.query(
      `SELECT r.*, rt.table_number, u.name as created_by_name
       FROM reservations r
       LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [result.insertId],
    )

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: newReservation[0],
    })
  } catch (error) {
    console.error("[v0] Create reservation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create reservation",
      error: error.message,
    })
  }
}

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params
    const errors = validationResult(req)

    console.log("[v0] Update reservation request:", { id, body: req.body })

    if (!errors.isEmpty()) {
      console.log("[v0] Validation errors:", errors.array())
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      })
    }

    const [existingReservations] = await pool.query("SELECT * FROM reservations WHERE id = ? AND deleted_at IS NULL", [
      id,
    ])

    if (existingReservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      })
    }

    const oldReservation = existingReservations[0]
    const updateData = req.body

    console.log("[v0] Update data:", updateData)

    if (
      (updateData.table_id !== undefined && updateData.table_id !== oldReservation.table_id) ||
      (updateData.status && updateData.status !== oldReservation.status)
    ) {
      if (oldReservation.table_id) {
        await pool.query("UPDATE restaurant_tables SET status = ? WHERE id = ?", ["available", oldReservation.table_id])
      }

      if (updateData.table_id && (updateData.status === "confirmed" || oldReservation.status === "confirmed")) {
        await pool.query("UPDATE restaurant_tables SET status = ? WHERE id = ?", ["reserved", updateData.table_id])
      }
    }

    const fields = []
    const values = []

    const allowedFields = [
      "customer_name",
      "customer_email",
      "customer_phone",
      "reservation_date",
      "reservation_time",
      "guests",
      "table_id",
      "special_requests",
      "status",
    ]

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

    const query = `UPDATE reservations SET ${fields.join(", ")} WHERE id = ?`
    console.log("[v0] SQL update query:", query)
    console.log("[v0] SQL values:", values)

    const [result] = await pool.query(query, values)
    console.log("[v0] SQL result:", result)

    const [updatedReservation] = await pool.query(
      `SELECT r.*, rt.table_number, u.name as created_by_name
       FROM reservations r
       LEFT JOIN restaurant_tables rt ON r.table_id = rt.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [id],
    )

    res.status(200).json({
      success: true,
      message: "Reservation updated successfully",
      data: updatedReservation[0],
    })
  } catch (error) {
    console.error("[v0] Update reservation error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update reservation",
      error: error.message,
    })
  }
}

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params

    console.log("[v0] ========== DELETE RESERVATION START ==========")
    console.log("[v0] Delete reservation request for ID:", id)

    const [reservations] = await pool.query("SELECT * FROM reservations WHERE id = ? AND deleted_at IS NULL", [id])

    if (reservations.length === 0) {
      console.log("[v0] Reservation not found or already deleted")
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      })
    }

    const reservation = reservations[0]
    console.log("[v0] Found reservation:", reservation)

    if (reservation.table_id) {
      console.log("[v0] Releasing table ID:", reservation.table_id)
      await pool.query("UPDATE restaurant_tables SET status = ? WHERE id = ?", ["available", reservation.table_id])
      console.log("[v0] Table released successfully")
    }

    console.log("[v0] Executing soft delete SQL")
    const [result] = await pool.query("UPDATE reservations SET deleted_at = NOW() WHERE id = ?", [id])
    console.log("[v0] SQL result:", result)

    const [verifyDeleted] = await pool.query("SELECT deleted_at FROM reservations WHERE id = ?", [id])
    console.log("[v0] Verification - deleted_at:", verifyDeleted[0]?.deleted_at)

    if (result.affectedRows === 0) {
      console.error("[v0] ERROR: No rows were affected by the delete query")
      return res.status(500).json({
        success: false,
        message: "Failed to delete reservation - no rows affected",
      })
    }

    console.log("[v0] Reservation deleted successfully")
    console.log("[v0] ========== DELETE RESERVATION END ==========")

    res.status(200).json({
      success: true,
      message: "Reservation deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Delete reservation error:", error)
    console.log("[v0] ========== DELETE RESERVATION ERROR END ==========")
    res.status(500).json({
      success: false,
      message: "Failed to delete reservation",
      error: error.message,
    })
  }
}

export const getReservationStats = async (req, res) => {
  try {
    const [totalCount] = await pool.query("SELECT COUNT(*) as count FROM reservations WHERE deleted_at IS NULL")

    const [todayCount] = await pool.query(
      "SELECT COUNT(*) as count FROM reservations WHERE reservation_date = CURDATE() AND deleted_at IS NULL",
    )

    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM reservations 
       WHERE deleted_at IS NULL 
       GROUP BY status`,
    )

    res.status(200).json({
      success: true,
      data: {
        total: totalCount[0].count,
        today: todayCount[0].count,
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
