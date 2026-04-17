"use client"

import { useState } from "react"
import { useAuth, type UserType } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GraduationCap,
  Shield,
  Wrench,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"

const roleButtons = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "staff", label: "Staff", icon: Wrench },
  { id: "admin", label: "Admin", icon: Shield },
] as const

const demoCredentials: Record<UserType, string> = {
  student: "student1@example.com",
  staff: "staff1@example.com",
  admin: "admin@example.com",
}

const roleButtonStyles: Record<UserType, string> = {
  student: "bg-blue-600 text-white",
  staff: "bg-emerald-600 text-white",
  admin: "bg-amber-600 text-white",
}

const roleLoginStyles: Record<UserType, string> = {
  student: "from-blue-500 to-indigo-600",
  staff: "from-emerald-500 to-teal-600",
  admin: "from-amber-500 to-orange-600",
}

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserType>("student")
  const [email, setEmail] = useState(demoCredentials.student)
  const [password, setPassword] = useState("Mkce@1122")
  const [showPassword, setShowPassword] = useState(false)

  const handleRoleChange = (role: UserType) => {
    setSelectedRole(role)
    setEmail(demoCredentials[role])
    setPassword("Mkce@1122")
    clearError()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !email || !password) {
      return
    }

    try {
      clearError()
      await login(email, password, selectedRole)
    } catch (err) {
      console.error('[v0] Login error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-center">MKCE Hostel Queue System</h1>
        <p className="text-sm text-center text-gray-300 mt-1">A QR-Based Smart Meal Token Platform</p>

        <div className="flex justify-center mt-2">
          <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">MKCE Project</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mt-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mt-1">
            {roleButtons.map((item) => {
              const IconComponent = item.icon
              const isSelected = selectedRole === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRoleChange(item.id as UserType)}
                  className={`flex-1 py-2 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition ${
                    isSelected
                      ? roleButtonStyles[item.id as UserType]
                      : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  <IconComponent size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5 mt-1">
            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError()
              }}
              disabled={loading}
              className="bg-gray-800/60 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError()
                }}
                disabled={loading}
                className="bg-gray-800/60 border-gray-700 text-white pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full mt-2 py-3 rounded-xl bg-gradient-to-r ${roleLoginStyles[selectedRole]} font-semibold hover:opacity-90 transition h-auto gap-2`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Access Dashboard
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-gray-400 mt-1 text-center">
            Demo: {demoCredentials[selectedRole]} / Mkce@1122
          </p>
        </form>
      </div>
    </div>
  )
}
