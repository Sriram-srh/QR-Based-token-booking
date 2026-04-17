"use client"

import { useEffect, useState } from "react"
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
  Sun,
  Moon,
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

const roleVisualStyles: Record<UserType, { gradient: string; label: string; Icon: typeof GraduationCap }> = {
  student: {
    gradient: "from-blue-500 to-indigo-500",
    label: "student",
    Icon: GraduationCap,
  },
  staff: {
    gradient: "from-orange-500 to-yellow-500",
    label: "staff",
    Icon: Wrench,
  },
  admin: {
    gradient: "from-red-500 to-pink-500",
    label: "admin",
    Icon: Shield,
  },
}

function RoleVisual({ role }: { role: UserType }) {
  const { Icon, gradient, label } = roleVisualStyles[role]

  return (
    <div className="hidden md:flex w-1/2 items-center justify-center relative">
      <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br ${gradient}`} />

      <div
        className={`relative w-64 h-64 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl transition-all duration-500 animate-float`}
      >
        <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-xl" />
        <div key={role} className="relative text-white transition-all duration-500 scale-100">
          <Icon size={70} strokeWidth={1.5} />
        </div>
      </div>

      <p className="absolute bottom-16 text-gray-400 text-lg capitalize tracking-wide">
        {label}
      </p>
    </div>
  )
}

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserType>("student")
  const [email, setEmail] = useState(demoCredentials.student)
  const [password, setPassword] = useState("Mkce@1122")
  const [showPassword, setShowPassword] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    setEmail(demoCredentials[selectedRole])
    setPassword("Mkce@1122")
    clearError()
  }, [selectedRole, clearError])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    document.documentElement.classList.toggle("light", theme === "light")
    localStorage.setItem("theme", theme)
  }, [theme])

  const handleRoleChange = (role: UserType) => {
    setSelectedRole(role)
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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-5 right-5 p-2 rounded-full bg-gray-200 dark:bg-gray-800 transition z-10"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full md:w-1/2 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-xl text-white">
          <h1 className="text-2xl font-bold text-center">
            MKCE Hostel Queue System
          </h1>
          <p className="text-sm text-center text-gray-300 mt-1">
            A QR-Based Smart Meal Token Platform
          </p>

          <div className="flex justify-center mt-2">
            <span className="inline-block mt-2 text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
              🎓 MKCE Project
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mt-5">
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-200">
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
              className={`w-full mt-2 py-3 rounded-xl bg-gradient-to-r ${roleLoginStyles[selectedRole]} font-semibold hover:opacity-90 transition h-auto gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
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

      <RoleVisual role={selectedRole} />
    </div>
  )
}
