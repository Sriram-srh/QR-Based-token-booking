"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeadersAsync, parseJsonSafe } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  CheckCheck,
  Eye,
} from "lucide-react"

type NotificationItem = {
  id: string
  message: string
  type: "success" | "warning" | "error" | "info"
  read: boolean
  timestamp: string
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-success",
    bg: "bg-success/10",
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    color: "text-primary",
    bg: "bg-primary/10",
  },
}

export function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const headers = await getAuthHeadersAsync()
      const response = await fetch(`/api/notifications?userId=${user.id}`, { cache: 'no-store', headers })
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await parseJsonSafe(response)
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('[v0] Notifications load error:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user?.id])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    if (!user?.id) return

    const current = notifications.find(n => n.id === id)
    if (!current || current.read) return

    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))

    try {
      const headers = await getAuthHeadersAsync()
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ id, userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notification')
      }
    } catch (error) {
      console.error('[v0] Mark notification read error:', error)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: false } : n)))
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      const headers = await getAuthHeadersAsync()
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notifications')
      }

      await loadNotifications()
    } catch (error) {
      console.error('[v0] Mark all read error:', error)
    }
  }

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [notifications]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your meal tokens and alerts</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {unreadCount} unread
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading && (
          <Card className="border-border/60">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading notifications...</CardContent>
          </Card>
        )}

        {!loading && sortedNotifications.map(notification => {
            const config = typeConfig[notification.type]
            return (
              <Card
                key={notification.id}
                className={`border-border/60 transition-all ${
                  notification.read ? "opacity-60" : "shadow-sm"
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at{" "}
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        Mark read
                      </Button>
                    )}
                    {notification.read && (
                      <Badge variant="outline" className="text-xs text-muted-foreground border-border flex-shrink-0">
                        Read
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
            })}
      </div>

      {notifications.length === 0 && (
        <Card className="border-border/60">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Notifications</h3>
            <p className="text-sm text-muted-foreground">{"You're all caught up!"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
