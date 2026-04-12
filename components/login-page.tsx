"use client"

import { useState, useEffect } from "react"
import { useAuth, type UserType } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GraduationCap,
  UtensilsCrossed,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Mail,
  Lock,
} from "lucide-react"

const roleConfig: Record<UserType, { label: string; icon: React.ReactNode; color: string; gradient: string; accentColor: string }> = {
  student: {
    label: "Student",
    icon: <GraduationCap size={80} className="text-white" />,
    color: "from-blue-500 to-blue-600",
    gradient: "from-blue-500 to-indigo-600",
    accentColor: "blue",
  },
  staff: {
    label: "Serving Staff",
    icon: <UtensilsCrossed size={80} className="text-white" />,
    color: "from-green-500 to-emerald-600",
    gradient: "from-green-500 to-emerald-600",
    accentColor: "green",
  },
  admin: {
    label: "Admin",
    icon: <ShieldCheck size={80} className="text-white" />,
    color: "from-purple-500 to-violet-600",
    gradient: "from-purple-500 to-violet-600",
    accentColor: "purple",
  },
}

const roleButtons = [
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "staff", label: "Staff", icon: UtensilsCrossed },
  { id: "admin", label: "Admin", icon: ShieldCheck },
] as const

const roleStyles: Record<UserType, string> = {
  student: "from-blue-500 to-indigo-600",
  staff: "from-green-500 to-emerald-600",
  admin: "from-purple-500 to-violet-600",
}

const roleShadows: Record<UserType, string> = {
  student: "shadow-blue-500/30 hover:shadow-blue-500/40",
  staff: "shadow-green-500/30 hover:shadow-green-500/40",
  admin: "shadow-purple-500/30 hover:shadow-purple-500/40",
}

export function LoginPage() {
  const { login, loading, error, clearError } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserType>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isDark, setIsDark] = useState<boolean | null>(null)

  // Initialize theme state from DOM on mount
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const current = document.documentElement.classList.contains("dark")
    const next = current ? "light" : "dark"

    document.documentElement.classList.remove(current ? "dark" : "light")
    document.documentElement.classList.add(next)
    localStorage.setItem("theme", next)
    setIsDark(next === "dark")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !email || !password) {
      return
    }

    try {
      await login(email, password, selectedRole)
    } catch (err) {
      console.error('[v0] Login error:', err)
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-100 via-white to-blue-100 dark:from-[#0F1115] dark:via-[#12141A] dark:to-[#0F172A] transition-colors duration-300">
      {/* Texture Layer - Subtle Noise */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAADICAYAAACjtjqSAAAACXBIWXMAACE4AAAhOAHaJGcaAAAAJklEQVR4nO3BMQEAAADCoPVPbQ1PoAAAAAAAAAAAAAAAAAAAAADwbxYKAAGQJVbsAAAAAElFTkSuQmCC')]"></div>

      {/* Soft Radial Glow Blob - Premium SaaS Feel */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/20 blur-3xl rounded-full pointer-events-none"></div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2.5 rounded-lg bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/10 backdrop-blur-md hover:bg-white/50 dark:hover:bg-white/20 transition-all z-10 text-gray-800 dark:text-white"
        aria-label="Toggle theme"
      >
        {isDark === null ? null : isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* LEFT SIDE - LOGIN FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 md:px-6 relative z-5">
        <div className="animate-fadeInUp w-full max-w-md relative">
          {/* Glass Card with Premium Styling & Depth */}
          <div className="relative backdrop-blur-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-2xl p-6 transition-all duration-300">
            {/* Glass Highlight Overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Welcome Back!</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Access your dashboard securely</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 dark:border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Segmented Role Selector with Icon Animation */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Role</Label>
                  <div className="flex gap-2">
                    {roleButtons.map((btn) => {
                      const IconComponent = btn.icon
                      const isSelected = selectedRole === btn.id
                      const config = roleConfig[btn.id as UserType]
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setSelectedRole(btn.id as UserType)}
                          className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                            isSelected
                              ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg shadow-${config.accentColor}-500/25 scale-105 hover:scale-110 active:scale-[0.98]`
                              : "bg-white/30 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/20 border border-white/40 dark:border-white/20 hover:scale-105 active:scale-[0.98]"
                          }`}
                        >
                          <IconComponent size={18} />
                          <span className="text-xs">{btn.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Email with Icon */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:scale-[1.01] transition-all"
                    />
                  </div>
                </div>

                {/* Password with Icon */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/40 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:scale-[1.01] transition-all"
                    />
                  </div>
                </div>

                {/* Sign In Button with Role-Based Color */}
                <Button
                  type="submit"
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${roleStyles[selectedRole]} text-white font-medium shadow-lg ${roleShadows[selectedRole]} transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] gap-2 h-auto`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">Signing in...</span>
                    </>
                  ) : (
                    <>
                      Access Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Demo Credentials */}
                <p className="text-xs text-center text-gray-600 dark:text-gray-500">
                  Demo: student1@example.com / password123
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - DYNAMIC ROLE AVATAR with Animation */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center px-6 relative z-5">
        <div className="relative w-80 h-80">
          {/* Animated Glow Background - Role Based */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${roleConfig[selectedRole]?.color || 'from-blue-500 to-blue-600'} opacity-20 blur-3xl animate-glow transition-all duration-500`}></div>

          {/* Glass Circle */}
          <div className="absolute inset-0 rounded-full backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-[0_12px_48px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center">
            {/* Inner Glow */}
            <div className={`absolute inset-4 rounded-full bg-gradient-to-br ${roleConfig[selectedRole]?.color || 'from-blue-500 to-blue-600'} opacity-10 blur-xl transition-all duration-500`}></div>

            {/* Role Icon with Pop Animation */}
            <div className="relative animate-fadeInUp transition-all duration-500 scale-110">
              {roleConfig[selectedRole]?.icon}
            </div>
          </div>

          {/* Role Label with Transition */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center transition-all duration-500">
            <p className="text-lg font-semibold text-gray-800 dark:text-white">{roleConfig[selectedRole]?.label}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
