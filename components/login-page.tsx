"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
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

const roleTheme: Record<
  UserType,
  {
    primary: string
    glowDark: string
    glowLight: string
    icon: typeof GraduationCap
    label: string
  }
> = {
  student: {
    primary: "from-blue-500 to-indigo-600",
    glowDark: "rgba(59,130,246,0.6)",
    glowLight: "rgba(59,130,246,0.25)",
    icon: GraduationCap,
    label: "student",
  },
  staff: {
    primary: "from-emerald-500 to-green-600",
    glowDark: "rgba(16,185,129,0.6)",
    glowLight: "rgba(16,185,129,0.25)",
    icon: Wrench,
    label: "staff",
  },
  admin: {
    primary: "from-orange-500 to-red-500",
    glowDark: "rgba(249,115,22,0.6)",
    glowLight: "rgba(249,115,22,0.25)",
    icon: Shield,
    label: "admin",
  },
}

function RoleVisual({ role, isDark }: { role: UserType; isDark: boolean }) {
  const { icon: Icon, primary, glowDark, glowLight, label } = roleTheme[role]

  return (
    <div className="hidden md:flex flex-1 items-center justify-center relative">
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-70 transition-all duration-500"
        style={{
          backgroundColor: isDark ? glowDark : glowLight,
        }}
      />

      <div
        className={`relative w-64 h-64 rounded-full flex items-center justify-center bg-gradient-to-br ${primary} shadow-2xl transition-all duration-500 animate-float`}
      >
        <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-xl" />
        <div key={role} className="relative text-white transition-all duration-500 scale-100">
          <Icon size={70} strokeWidth={1.5} />
        </div>
      </div>

      <p className="absolute bottom-16 text-gray-500 dark:text-gray-400 text-lg capitalize tracking-wide">
        {label}
      </p>
    </div>
  )
}

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [selectedRole, setSelectedRole] = useState<UserType>("student")
  const [email, setEmail] = useState(demoCredentials.student)
  const [password, setPassword] = useState("Mkce@1122")
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setEmail(demoCredentials[selectedRole])
    setPassword("Mkce@1122")
    clearError()
  }, [selectedRole, clearError])

  const isDark = mounted ? resolvedTheme !== "light" : true

  const roleVisualStyles = roleTheme[selectedRole]

  const getRoleButtonStyle = (role: UserType, isSelected: boolean) => {
    if (isSelected) {
      if (role === "student") {
        return "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-blue-500/40"
      }
      if (role === "staff") {
        return "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-105 border-emerald-500/40"
      }
      return "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105 border-orange-500/40"
    }

    return "text-gray-700 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/10 border"
  }

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
    <div
      className="min-h-screen flex items-center justify-center text-gray-900 dark:text-white"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="absolute top-5 right-5 p-2 rounded-full transition z-10"
        style={{
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.75)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
        }}
        aria-label="Toggle theme"
        disabled={!mounted}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full px-6 py-8">
        <div className="w-full max-w-6xl mx-auto flex items-center gap-8 md:gap-12">
        <div className="w-full max-w-md">
          <div
            className="w-full max-w-md rounded-2xl backdrop-blur-xl p-6 shadow-xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
          <h1 className="text-2xl font-bold text-center" style={{ color: "var(--text-primary)" }}>
            MKCE Hostel Queue System
          </h1>
          <p className="text-sm text-center mt-1" style={{ color: "var(--text-secondary)" }}>
            A QR-Based Smart Meal Token Platform
          </p>

          <div className="flex justify-center mt-2">
            <span
              className="inline-block mt-2 text-xs px-3 py-1 rounded-full"
              style={{
                backgroundColor: isDark ? "rgba(59,130,246,0.16)" : "rgba(59,130,246,0.12)",
                color: isDark ? "#bfdbfe" : "#2563eb",
                border: "1px solid var(--border-color)",
              }}
            >
              🎓 MKCE Project
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 mt-5">
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-500/10 border-red-500/30"
                style={{ color: isDark ? "#fecaca" : "#b91c1c" }}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 mt-1">
              {roleButtons.map((item) => {
                const IconComponent = item.icon
                const isSelected = selectedRole === item.id
                const roleId = item.id as UserType
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRoleChange(roleId)}
                    className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${getRoleButtonStyle(roleId, isSelected)}`}
                    style={{
                      backgroundColor: isSelected
                        ? undefined
                        : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.68)",
                      color: isSelected ? undefined : "var(--text-secondary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <IconComponent size={16} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="space-y-1.5 mt-1">
              <Label htmlFor="email" style={{ color: "var(--text-secondary)" }}>Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearError()
                }}
                disabled={loading}
                className="text-gray-900 dark:text-white"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-color)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" style={{ color: "var(--text-secondary)" }}>Password</Label>
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
                  className="text-gray-900 dark:text-white pr-10"
                  style={{
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-color)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80"
                  style={{ color: "var(--text-secondary)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full mt-2 py-3 rounded-xl bg-gradient-to-r ${roleVisualStyles.primary} font-semibold hover:opacity-90 transition h-auto gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
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

            <p className="text-xs mt-1 text-center" style={{ color: "var(--text-secondary)" }}>
              Demo: {demoCredentials[selectedRole]} / Mkce@1122
            </p>
          </form>
          </div>
        </div>
        <RoleVisual role={selectedRole} isDark={isDark} />
        </div>
      </div>
    </div>
  )
}
