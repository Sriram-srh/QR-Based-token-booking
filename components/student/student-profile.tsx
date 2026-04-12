"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeaders } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User,
  Lock,
  Mail,
  Phone,
  Home,
  DoorOpen,
  Hash,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react"

export function StudentProfile() {
  const { student, user } = useAuth()
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (!user?.id) {
      setPasswordError('Session expired. Please sign in again.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      setUpdatingPassword(true)
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setPasswordError(data.error || 'Failed to update password')
        return
      }

      setPasswordChanged(true)
      setTimeout(() => {
        setChangePasswordOpen(false)
        setPasswordChanged(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordError(null)
      }, 1500)
    } catch (error) {
      setPasswordError('Failed to update password')
    } finally {
      setUpdatingPassword(false)
    }
  }

  if (!student) return null

  const profileFields = [
    { label: "Register Number", value: student.registerNumber, icon: <Hash className="h-4 w-4" /> },
    { label: "Hostel", value: student.hostel, icon: <Home className="h-4 w-4" /> },
    { label: "Room Number", value: student.room, icon: <DoorOpen className="h-4 w-4" /> },
    { label: "Email", value: student.email, icon: <Mail className="h-4 w-4" /> },
    { label: "Phone", value: student.phone, icon: <Phone className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">View your personal details</p>
      </div>

      {/* Profile Card */}
      <Card className="border-border/60 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(230,91%,50%)]" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
            <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center overflow-hidden shadow-lg">
              {student.photoUrl ? (
                <img src={student.photoUrl} alt={student.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-4">
              <h2 className="text-xl font-bold text-card-foreground">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.registerNumber}</p>
            </div>
            <Badge variant="outline" className="text-xs mt-2 sm:mt-4 text-foreground">Student Account</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Personal Information</CardTitle>
          <CardDescription>This information is managed by the hostel admin. Contact admin for changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileFields.map((field) => (
            <div key={field.label} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                {field.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="text-sm font-medium text-foreground truncate">{field.value}</p>
              </div>
              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Security</CardTitle>
          <CardDescription>Manage your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2" onClick={() => setChangePasswordOpen(true)}>
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          {!passwordChanged ? (
            <form onSubmit={handleChangePassword}>
              <DialogHeader>
                <DialogTitle className="text-foreground">Change Password</DialogTitle>
                <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPw" className="text-foreground">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPw"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="pr-10 bg-background text-foreground"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPw" className="text-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPw"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="pr-10 bg-background text-foreground"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPw" className="text-foreground">Confirm New Password</Label>
                  <Input
                    id="confirmPw"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="bg-background text-foreground"
                    required
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || updatingPassword}>
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Password Updated!</h3>
                <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
