"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface PasswordStrengthProps {
  password: string
  onStrengthChange: (strength: "weak" | "medium" | "strong" | null) => void
}

export default function PasswordStrength({ password, onStrengthChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState<"weak" | "medium" | "strong" | null>(null)

  useEffect(() => {
    if (!password) {
      setStrength(null)
      onStrengthChange(null)
      return
    }

    let score = 0

    if (password.length >= 8) score++
    if (password.length >= 12) score++

    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    let newStrength: "weak" | "medium" | "strong"
    if (score <= 2) {
      newStrength = "weak"
    } else if (score <= 4) {
      newStrength = "medium"
    } else {
      newStrength = "strong"
    }

    setStrength(newStrength)
    onStrengthChange(newStrength)
  }, [password, onStrengthChange])

  if (!password) return null

  const getColor = () => {
    switch (strength) {
      case "weak":
        return "text-red-600 dark:text-red-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "strong":
        return "text-green-600 dark:text-green-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const getIcon = () => {
    switch (strength) {
      case "weak":
        return <XCircle className="w-4 h-4" />
      case "medium":
        return <AlertCircle className="w-4 h-4" />
      case "strong":
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return null
    }
  }

  const getBarWidth = () => {
    switch (strength) {
      case "weak":
        return "w-1/3"
      case "medium":
        return "w-2/3"
      case "strong":
        return "w-full"
      default:
        return "w-0"
    }
  }

  const getBarColor = () => {
    switch (strength) {
      case "weak":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "strong":
        return "bg-green-500"
      default:
        return "bg-gray-300"
    }
  }

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${getBarWidth()} ${getBarColor()} transition-all duration-300`} />
      </div>
      <div className={`flex items-center gap-2 text-sm ${getColor()}`}>
        {getIcon()}
        <span className="font-medium">Fuerza contraseña: {strength ? strength.charAt(0).toUpperCase() + strength.slice(1) : ""}</span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Contraseña debe tener:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li className={password.length >= 8 ? "text-green-600" : ""}>al menos 8 caracteres</li>
          <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>letra mayuscula</li>
          <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>letra minuscula</li>
          <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>numero</li>
          <li className={/[^a-zA-Z0-9]/.test(password) ? "text-green-600" : ""}>caracter especial</li>
        </ul>
      </div>
    </div>
  )
}
