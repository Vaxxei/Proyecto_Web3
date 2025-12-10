"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"

interface SimpleCaptchaProps {
  onValidate: (isValid: boolean) => void
}

export default function SimpleCaptcha({ onValidate }: SimpleCaptchaProps) {
  const [captchaText, setCaptchaText] = useState("")
  const [userInput, setUserInput] = useState("")
  const [isValid, setIsValid] = useState(false)

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaText(result)
    setUserInput("")
    setIsValid(false)
    onValidate(false)
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  useEffect(() => {
    const valid = userInput.toLowerCase() === captchaText.toLowerCase() && userInput !== ""
    setIsValid(valid)
    onValidate(valid)
  }, [userInput, captchaText, onValidate])

  return (
    <div className="space-y-2">
      <Label>CAPTCHA</Label>
      <div className="flex gap-2">
        <div className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-md p-3 flex items-center justify-center font-mono text-lg tracking-widest select-none">
          <span className="text-orange-600 dark:text-orange-400 font-bold transform skew-y-2">{captchaText}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={generateCaptcha}
          className="shrink-0 bg-transparent"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <Input
        type="text"
        placeholder="Ingrese el texto superior"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className={isValid ? "border-green-500" : ""}
      />
      {isValid && <p className="text-sm text-green-600 dark:text-green-400">CAPTCHA verificado!</p>}
    </div>
  )
}
