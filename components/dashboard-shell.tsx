"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeaders, parseJsonSafe } from "@/lib/client-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  QrCode,
  LogOut,
  Bell,
  User,
  Menu,
  X,
  Home,
  Ticket,
  ScanLine,
  BarChart3,
  FileText,
  Settings,
  UtensilsCrossed,
  Monitor,
  IndianRupee,
  Users,
  UserCog,
  CreditCard,
  CalendarDays,
} from "lucide-react"
type NotificationItem = {
  id: string
  message: string
  type: "success" | "warning" | "error" | "info"
  read: boolean
  timestamp: string
}

interface NavItem {
  label: string
  value: string
  icon: React.ReactNode
}

const studentNav: NavItem[] = [
  { label: "Dashboard", value: "dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Book Token", value: "book", icon: <Ticket className="h-4 w-4" /> },
  { label: "My Tokens", value: "tokens", icon: <QrCode className="h-4 w-4" /> },
  { label: "Upcoming Menus", value: "upcoming", icon: <CalendarDays className="h-4 w-4" /> },
  { label: "Billing", value: "billing", icon: <IndianRupee className="h-4 w-4" /> },
  { label: "Notifications", value: "notifications", icon: <Bell className="h-4 w-4" /> },
  { label: "Profile", value: "profile", icon: <User className="h-4 w-4" /> },
]

const staffNav: NavItem[] = [
  { label: "Verification", value: "verify", icon: <ScanLine className="h-4 w-4" /> },
]

const adminNav: NavItem[] = [
  { label: "Dashboard", value: "dashboard", icon: <Home className="h-4 w-4" /> },
  { label: "Meals", value: "meals", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { label: "Counters", value: "counters", icon: <Monitor className="h-4 w-4" /> },
  { label: "Students", value: "students", icon: <Users className="h-4 w-4" /> },
  { label: "Staff", value: "staff", icon: <UserCog className="h-4 w-4" /> },
  { label: "Payments", value: "payments", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Analytics", value: "analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Logs", value: "logs", icon: <FileText className="h-4 w-4" /> },
  { label: "Settings", value: "settings", icon: <Settings className="h-4 w-4" /> },
]

export function DashboardShell({
  children,
  activeTab,
  onTabChange,
}: {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}) {
  const { role, logout, student, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const unreadCount = notifications.filter(n => !n.read).length

  const loadNotifications = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`, { cache: 'no-store', headers: { ...getAuthHeaders() } })
      if (!response.ok) {
        return
      }

      const data = await parseJsonSafe(response)
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('[v0] Failed to load header notifications:', error)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user?.id])

  const markNotifRead = async (id: string) => {
    if (!user?.id) return

    const current = notifications.find(n => n.id === id)
    if (!current || current.read) return

    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))

    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('[v0] Failed to mark notification as read:', error)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: false } : n)))
    }
  }

  const navItems = role === "student" ? studentNav : role === "staff" ? staffNav : adminNav

  const roleLabel = role === "student" ? "Student" : role === "staff" ? "Serving Staff" : "Admin"
  const roleColor = role === "student" ? "bg-primary/10 text-primary" : role === "staff" ? "bg-accent/10 text-accent" : "bg-warning/10 text-warning"

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 text-foreground inline-flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground hidden sm:block">SmartMeal QR</span>
            </div>
            <Badge className={`${roleColor} border-0 text-xs font-medium`}>{roleLabel}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-foreground hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-semibold text-sm text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                {notifications.slice(0, 4).map(n => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                      n.read ? "opacity-50" : ""
                    }`}
                    onClick={() => {
                      markNotifRead(n.id)
                      if (role === "student") onTabChange("notifications")
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        n.read ? "bg-muted-foreground/30" :
                        n.type === "success" ? "bg-success" : n.type === "warning" ? "bg-warning" : n.type === "error" ? "bg-destructive" : "bg-primary"
                      }`} />
                      <span className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                        {n.message}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-4">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </DropdownMenuItem>
                ))}
                {role === "student" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-center text-xs text-primary cursor-pointer justify-center font-medium"
                      onClick={() => onTabChange("notifications")}
                    >
                      View all notifications
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-foreground hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">
                    {student ? student.name : roleLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student ? student.registerNumber : "Staff Account"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                {role === "student" && (
                  <DropdownMenuItem onClick={() => onTabChange("profile")} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden lg:flex gap-1 px-4 max-w-7xl mx-auto pb-0 overflow-x-auto" role="navigation" aria-label="Main navigation">
          {navItems.map(item => (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === item.value
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-current={activeTab === item.value ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border p-4 shadow-xl"
            onClick={e => e.stopPropagation()}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center gap-2 mb-6 mt-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <QrCode className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">SmartMeal QR</span>
            </div>
            <div className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.value}
                  onClick={() => { onTabChange(item.value); setMobileOpen(false) }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  )
}
