import { reservationsAPI } from "./api/reservations"
import { tablesAPI } from "./api/tables"
import { usersAPI } from "./api/users"

export const generateReservationsPDF = async (startDate: string, endDate: string) => {
  try {
    const reservations = await reservationsAPI.getAll()
    const filtered = reservations.filter((res) => {
      const resDate = new Date(res.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return resDate >= start && resDate <= end && !res.isDeleted
    })
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Reservaciones</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ea580c; text-align: center; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #ea580c; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-confirmed { background-color: #d1fae5; color: #065f46; }
            .status-completed { background-color: #dbeafe; color: #1e40af; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Sistema de Reservaciones en Restaurantes</h1>
            <h2>Reservaciones</h2>
          </div>
          <div class="info">
            <p><strong>Reporte Generado:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Rango de Fecha:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
            <p><strong>Reservaciones Totales:</strong> ${filtered.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Telefono</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Invitados</th>
                <th>Mesa</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length === 0
                  ? '<tr><td colspan="8" style="text-align: center;">No se encontraron reservaciones.</td></tr>'
                  : filtered
                      .map(
                        (res) => `
                  <tr>
                    <td>${res.customerName}</td>
                    <td>${res.customerEmail}</td>
                    <td>${res.customerPhone}</td>
                    <td>${new Date(res.date).toLocaleDateString()}</td>
                    <td>${res.time}</td>
                    <td>${res.guests}</td>
                    <td>${res.tableNumber || res.tableId || "N/A"}</td>
                    <td><span class="status status-${res.status}">${res.status.toUpperCase()}</span></td>
                  </tr>
                `,
                      )
                      .join("")
              }
            </tbody>
          </table>
          <div class="footer">
            <p>Generatdo por Brian Sanchez</p>
            <p>© ${new Date().getFullYear()} Derechos reservados</p>
          </div>
        </body>
      </html>
    `

    // Open print dialog
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  } catch (error) {
    console.error("Fallo al generar PDF:", error)
    throw error
  }
}

export const generateTablesPDF = async () => {
  try {
    const tables = await tablesAPI.getAll()
    const filtered = tables.filter((t) => !t.isDeleted)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Mesas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ea580c; text-align: center; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #ea580c; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .status-available { background-color: #d1fae5; color: #065f46; }
            .status-occupied { background-color: #fee2e2; color: #991b1b; }
            .status-reserved { background-color: #fef3c7; color: #92400e; }
            .status-maintenance { background-color: #e5e7eb; color: #374151; }
            .location-indoor { background-color: #dbeafe; color: #1e40af; }
            .location-outdoor { background-color: #d1fae5; color: #065f46; }
            .location-terrace { background-color: #e9d5ff; color: #6b21a8; }
            .location-bar { background-color: #fed7aa; color: #92400e; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Sistema de Reservaciones en Restaurantes</h1>
            <h2>Mesas</h2>
          </div>
          <div class="info">
            <p><strong>Reporte Generado:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total de Mesas:</strong> ${filtered.length}</p>
            <p><strong>Mesas Disponibles:</strong> ${filtered.filter((t) => t.status === "available").length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Numero de Mesa</th>
                <th>Capacidad</th>
                <th>Locación</th>
                <th>Estado</th>
                <th>Descripcion</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length === 0
                  ? '<tr><td colspan="5" style="text-align: center;">No se encontraron mesas.</td></tr>'
                  : filtered
                      .map(
                        (table) => `
                  <tr>
                    <td><strong>${table.tableNumber}</strong></td>
                    <td>${table.capacity} guests</td>
                    <td><span class="badge location-${table.location}">${table.location.toUpperCase()}</span></td>
                    <td><span class="badge status-${table.status}">${table.status.toUpperCase()}</span></td>
                    <td>${table.description || "N/A"}</td>
                  </tr>
                `,
                      )
                      .join("")
              }
            </tbody>
          </table>
          <div class="footer">
            <p>Generado por Brian Sanchez</p>
            <p>© ${new Date().getFullYear()} Derechos Reservados</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  } catch (error) {
    console.error("Fallo al generar PDF:", error)
    throw error
  }
}

export const generateUsersPDF = async () => {
  try {
    const users = await usersAPI.getAll()
    const filtered = users.filter((u) => !u.isDeleted)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte Usuarios</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ea580c; text-align: center; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #ea580c; color: white; padding: 12px; text-align: left; }
            td { border: 1px solid #ddd; padding: 10px; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
            .role-admin { background-color: #fee2e2; color: #991b1b; }
            .role-manager { background-color: #dbeafe; color: #1e40af; }
            .role-staff { background-color: #d1fae5; color: #065f46; }
            .status-active { background-color: #d1fae5; color: #065f46; }
            .status-inactive { background-color: #e5e7eb; color: #374151; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Sistema de Reservaciones en Restaurantes</h1>
            <h2>Usuarios</h2>
          </div>
          <div class="info">
            <p><strong>Reporte Generado:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Usarios:</strong> ${filtered.length}</p>
            <p><strong>Usuarios Activos:</strong> ${filtered.filter((u) => u.status === "active").length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado en</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length === 0
                  ? '<tr><td colspan="5" style="text-align: center;">No se encontraron usuarios.</td></tr>'
                  : filtered
                      .map(
                        (user) => `
                  <tr>
                    <td>${user.fullName || user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge role-${user.role}">${user.role.toUpperCase()}</span></td>
                    <td><span class="badge status-${user.status}">${user.status.toUpperCase()}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                `,
                      )
                      .join("")
              }
            </tbody>
          </table>
          <div class="footer">
            <p>Generado por Brian Sanchez</p>
            <p>© ${new Date().getFullYear()} Derechos Reservados</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  } catch (error) {
    console.error("Fallo al generar PDF:", error)
    throw error
  }
}

export const generateSummaryPDF = async (startDate: string, endDate: string) => {
  try {
    const [reservations, tables, users] = await Promise.all([
      reservationsAPI.getAll(),
      tablesAPI.getAll(),
      usersAPI.getAll(),
    ])

    const filteredReservations = reservations.filter((res) => {
      const resDate = new Date(res.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return resDate >= start && resDate <= end && !res.isDeleted
    })

    const stats = {
      totalReservations: filteredReservations.length,
      pendingReservations: filteredReservations.filter((r) => r.status === "pending").length,
      confirmedReservations: filteredReservations.filter((r) => r.status === "confirmed").length,
      completedReservations: filteredReservations.filter((r) => r.status === "completed").length,
      cancelledReservations: filteredReservations.filter((r) => r.status === "cancelled").length,
      totalTables: tables.filter((t) => !t.isDeleted).length,
      availableTables: tables.filter((t) => t.status === "available" && !t.isDeleted).length,
      occupiedTables: tables.filter((t) => t.status === "occupied" && !t.isDeleted).length,
      totalUsers: users.filter((u) => !u.isDeleted).length,
      activeUsers: users.filter((u) => u.status === "active" && !u.isDeleted).length,
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte General</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ea580c; text-align: center; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .info { margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
            .stat-card h3 { color: #ea580c; font-size: 32px; margin: 10px 0; }
            .stat-card p { color: #6b7280; font-size: 14px; margin: 0; }
            .section { margin: 30px 0; }
            .section h2 { color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            li:last-child { border-bottom: none; }
            .value { float: right; font-weight: bold; color: #ea580c; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🍽️ Sistema de Reservaciones en Restaurantes</h1>
            <h2>Resumen</h2>
          </div>
          <div class="info">
            <p><strong>Reporte Generado:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Periodo:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <p>Total Reservaciones</p>
              <h3>${stats.totalReservations}</h3>
            </div>
            <div class="stat-card">
              <p>Total Mesas</p>
              <h3>${stats.totalTables}</h3>
            </div>
            <div class="stat-card">
              <p>Usuarios Activos</p>
              <h3>${stats.activeUsers}</h3>
            </div>
          </div>

          <div class="section">
            <h2>Reservaciones</h2>
            <ul>
              <li>Total reservaciones <span class="value">${stats.totalReservations}</span></li>
              <li>Pendiente reservaciones <span class="value">${stats.pendingReservations}</span></li>
              <li>Confirmado reservaciones <span class="value">${stats.confirmedReservations}</span></li>
              <li>Completado reservaciones <span class="value">${stats.completedReservations}</span></li>
              <li>Cancelado reservaciones <span class="value">${stats.cancelledReservations}</span></li>
            </ul>
          </div>

          <div class="section">
            <h2>Mesas</h2>
            <ul>
              <li>Total mesas <span class="value">${stats.totalTables}</span></li>
              <li>Disponibles mesas <span class="value">${stats.availableTables}</span></li>
              <li>Ocupadas mesas <span class="value">${stats.occupiedTables}</span></li>
            </ul>
          </div>

          <div class="section">
            <h2>Usuarios</h2>
            <ul>
              <li>Total usuarios <span class="value">${stats.totalUsers}</span></li>
              <li>Activos usuarios <span class="value">${stats.activeUsers}</span></li>
              <li>Inactivos usuarios <span class="value">${stats.totalUsers - stats.activeUsers}</span></li>
            </ul>
          </div>

          <div class="footer">
            <p>Generado por Brian Sanchez</p>
            <p>© ${new Date().getFullYear()} Derechos Reservados</p>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  } catch (error) {
    console.error("Fallo al generar PDF:", error)
    throw error
  }
}
