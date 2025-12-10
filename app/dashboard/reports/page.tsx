"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, Download, Calendar, TrendingUp, Users, TableProperties } from "lucide-react"
import { generateReservationsPDF, generateTablesPDF, generateUsersPDF, generateSummaryPDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const { toast } = useToast()
  const [reportType, setReportType] = useState("reservations")
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  })
  const [generating, setGenerating] = useState(false)

  const handleGeneratePDF = async () => {
    setGenerating(true)

    try {
      switch (reportType) {
        case "reservations":
          await generateReservationsPDF(dateRange.startDate, dateRange.endDate)
          break
        case "tables":
          await generateTablesPDF()
          break
        case "users":
          await generateUsersPDF()
          break
        case "summary":
          await generateSummaryPDF(dateRange.startDate, dateRange.endDate)
          break
      }

      toast({
        title: "Exito",
        description: "Reporte PDF generado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Fallo en generar reporte PDF",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const reportTypes = [
    { value: "reservations", label: "Reporte de Reservaciones", description: "Lista de todas las reservaciones", icon: Calendar },
    { value: "tables", label: "Reporte de Mesas", description: "Estado de las mesas", icon: TableProperties },
    { value: "users", label: "Reporte de Usuarios", description: "Lista de todos los usuarios", icon: Users },
    { value: "summary", label: "Reporte General", description: "Resumen general", icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground mt-2">Generar y descargar los reportes en PDF</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Generar Reporte</CardTitle>
              <CardDescription>Seleccionar el reporte y rango de fecha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportType">Tipo de Reporte</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(reportType === "reservations" || reportType === "summary") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de finalización</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleGeneratePDF}
                disabled={generating}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600"
              >
                <Download className="w-4 h-4 mr-2" />
                {generating ? "Generating..." : "Generate PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Reportes disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer transition-all ${
                      reportType === type.value ? "border-orange-500 shadow-lg" : "hover:shadow-md"
                    }`}
                    onClick={() => setReportType(type.value)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-base">{type.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
