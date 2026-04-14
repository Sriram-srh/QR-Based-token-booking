"use client"

import { useEffect, useMemo, useState } from "react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { LoginPage } from "@/components/login-page"
import { DashboardShell } from "@/components/dashboard-shell"
import { StudentDashboard } from "@/components/student/student-dashboard"
import { BookToken } from "@/components/student/book-token"
import { MyTokens } from "@/components/student/my-tokens"
import { UpcomingMenus } from "@/components/student/upcoming-menus"
import { StudentProfile } from "@/components/student/student-profile"
import { StudentBilling } from "@/components/student/student-billing"
import { NotificationsPage } from "@/components/student/notifications-page"
import { VerificationScreen } from "@/components/staff/verification-screen"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { MealManagement } from "@/components/admin/meal-management"
import { CounterManagement } from "@/components/admin/counter-management"
import { StudentAccounts } from "@/components/admin/student-accounts"
import { StaffAccounts } from "@/components/admin/staff-accounts"
import { PaymentControl } from "@/components/admin/payment-control"
import { AnalyticsPage } from "@/components/admin/analytics-page"
import { AuditLogs } from "@/components/admin/audit-logs"
import { AdminSettings } from "@/components/admin/admin-settings"

function AppContent() {
  const { isLoggedIn, user, role, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  const userType = role || user?.role || user?.userType || (user as any)?.user_metadata?.role

  const allowedTabs = useMemo(() => {
    if (userType !== "student" && userType !== "staff" && userType !== "admin") {
      return []
    }
    if (userType === "student") {
      return ["dashboard", "book", "tokens", "upcoming", "billing", "notifications", "profile"]
    }
    if (userType === "staff") {
      return ["verify"]
    }
    return ["dashboard", "meals", "counters", "students", "staff", "payments", "analytics", "logs", "settings"]
  }, [userType])

  const defaultTab = userType === "staff" ? "verify" : "dashboard"

  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      console.warn("⚠️ RESETTING TAB:", {
        activeTab,
        allowedTabs,
        userType,
        defaultTab
      })
      setActiveTab(defaultTab)
    }
  }, [activeTab, allowedTabs, defaultTab])

  const handleTabChange = (tab: string) => {
    console.log("TAB CLICK:", tab)
    console.log("ALLOWED TABS:", allowedTabs)
    if (allowedTabs.includes(tab)) {
      setActiveTab(tab)
    } else {
      console.warn("❌ TAB NOT IN ALLOWED TABS:", tab)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!isLoggedIn) {
    return <LoginPage />
  }

  if (userType !== "student" && userType !== "staff" && userType !== "admin") {
    return <LoginPage />
  }

  // Staff only has one screen
  if (userType === "staff") {
    return (
      <DashboardShell activeTab="verify" onTabChange={handleTabChange}>
        <VerificationScreen />
      </DashboardShell>
    )
  }

  // Student screens
  if (userType === "student") {
    return (
      <DashboardShell activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === "dashboard" && <StudentDashboard onNavigate={handleTabChange} />}
        {activeTab === "book" && <BookToken onNavigate={handleTabChange} />}
        {activeTab === "tokens" && <MyTokens />}
        {activeTab === "upcoming" && <UpcomingMenus />}
        {activeTab === "billing" && <StudentBilling />}
        {activeTab === "notifications" && <NotificationsPage />}
        {activeTab === "profile" && <StudentProfile />}
      </DashboardShell>
    )
  }

  // Admin screens
  return (
    <DashboardShell activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === "dashboard" && <AdminDashboard onNavigate={handleTabChange} />}
      {activeTab === "meals" && <MealManagement />}
      {activeTab === "counters" && <CounterManagement />}
      {activeTab === "students" && <StudentAccounts />}
      {activeTab === "staff" && <StaffAccounts />}
      {activeTab === "payments" && <PaymentControl />}
      {activeTab === "analytics" && <AnalyticsPage />}
      {activeTab === "logs" && <AuditLogs />}
      {activeTab === "settings" && <AdminSettings />}
    </DashboardShell>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
