// Types
export type Role = "student" | "staff" | "admin"

export type TokenStatus = "VALID" | "USED" | "EXPIRED" | "CANCELLED"

export type MealType = "Breakfast" | "Lunch" | "Dinner"

export type PaymentStatus = "Paid" | "Not Paid"

export type PreBookingStatus = "PENDING" | "ACTIVE" | "SERVED" | "CANCELLED"

export interface Student {
  id: string
  name: string
  registerNumber: string
  hostel: string
  room: string
  photoUrl: string
  email: string
  phone: string
  password: string
}

export interface MenuItem {
  id: string
  name: string
  cost: number
  maxQuantity: number
}

export interface BookedItem {
  itemId: string
  name: string
  cost: number
  quantity: number
}

export interface MealToken {
  id: string
  studentId: string
  mealType: MealType
  status: TokenStatus
  qrCode: string
  bookedItems: BookedItem[]
  totalCost: number
  createdAt: Date
  expiresAt: Date
  scannedAt?: Date
  counter?: string
}

export interface PreBooking {
  id: string
  studentId: string
  mealDate: string
  mealType: MealType
  bookedItems: BookedItem[]
  totalCost: number
  status: PreBookingStatus
  createdAt: Date
  qrTokenId?: string
}

export interface Meal {
  id: string
  type: MealType
  menuItems: MenuItem[]
  date: string
  bookingStart: string
  bookingEnd: string
  maxQuota: number
  bookedCount: number
  isOpen: boolean
}

export interface Counter {
  id: string
  name: string
  type: string
  isActive: boolean
  tokensServed: number
  assignedStaff: string | null
}

export interface StaffMember {
  id: string
  name: string
  employeeNumber: string
  assignedCounter: string | null
}

export interface AuditLog {
  id: string
  action: string
  user: string
  role: Role
  details: string
  timestamp: Date
}

export interface Notification {
  id: string
  message: string
  type: "success" | "warning" | "error" | "info"
  timestamp: Date
  read: boolean
}

export interface StudentPayment {
  studentId: string
  studentName: string
  registerNumber: string
  photoUrl: string
  totalMeals: number
  breakfastCount: number
  lunchCount: number
  dinnerCount: number
  totalAmount: number
  paymentStatus: PaymentStatus
  lastPaymentDate: string | null
}

export interface PaymentHistoryEntry {
  id: string
  date: string
  amount: number
  status: PaymentStatus
}

// Mock Data
export const mockStudent: Student = {
  id: "STU001",
  name: "Arjun Kumar",
  registerNumber: "21BCE1234",
  hostel: "Men's Hostel Block A",
  room: "A-304",
  photoUrl: "/placeholder-student.jpg",
  email: "arjun.kumar@college.edu",
  phone: "+91 98765 43210",
  password: "password123",
}

export const mockMeals: Meal[] = [
  {
    id: "meal-1",
    type: "Breakfast",
    menuItems: [
      { id: "mi-1a", name: "Idli (2 pcs)", cost: 15, maxQuantity: 3 },
      { id: "mi-1b", name: "Vada (2 pcs)", cost: 12, maxQuantity: 2 },
      { id: "mi-1c", name: "Sambar & Chutney", cost: 8, maxQuantity: 2 },
      { id: "mi-1d", name: "Tea/Coffee", cost: 10, maxQuantity: 4 },
    ],
    date: "2026-02-14",
    bookingStart: "06:00",
    bookingEnd: "09:00",
    maxQuota: 200,
    bookedCount: 142,
    isOpen: true,
  },
  {
    id: "meal-2",
    type: "Lunch",
    menuItems: [
      { id: "mi-2a", name: "Rice", cost: 15, maxQuantity: 2 },
      { id: "mi-2b", name: "Dal Fry", cost: 12, maxQuantity: 2 },
      { id: "mi-2c", name: "Paneer Butter Masala", cost: 25, maxQuantity: 1 },
      { id: "mi-2d", name: "Roti (2 pcs)", cost: 10, maxQuantity: 3 },
      { id: "mi-2e", name: "Salad", cost: 5, maxQuantity: 2 },
      { id: "mi-2f", name: "Buttermilk", cost: 8, maxQuantity: 2 },
    ],
    date: "2026-02-14",
    bookingStart: "11:00",
    bookingEnd: "14:00",
    maxQuota: 250,
    bookedCount: 89,
    isOpen: true,
  },
  {
    id: "meal-3",
    type: "Dinner",
    menuItems: [
      { id: "mi-3a", name: "Chapati (3 pcs)", cost: 12, maxQuantity: 3 },
      { id: "mi-3b", name: "Mixed Veg Curry", cost: 18, maxQuantity: 2 },
      { id: "mi-3c", name: "Curd Rice", cost: 15, maxQuantity: 2 },
      { id: "mi-3d", name: "Gulab Jamun (2 pcs)", cost: 10, maxQuantity: 2 },
    ],
    date: "2026-02-14",
    bookingStart: "18:00",
    bookingEnd: "21:00",
    maxQuota: 220,
    bookedCount: 220,
    isOpen: false,
  },
]

// Generate upcoming menus for next 10 days
function toLocalDateString(date: Date): string {
  const local = new Date(date)
  local.setHours(0, 0, 0, 0)
  const year = local.getFullYear()
  const month = String(local.getMonth() + 1).padStart(2, '0')
  const day = String(local.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function generateUpcomingMeals(): Meal[] {
  const menus: Meal[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let day = 0; day < 10; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)
    const dateStr = toLocalDateString(date)
    
    menus.push(
      {
        id: `meal-up-bf-${day}`,
        type: "Breakfast",
        menuItems: [
          { id: `mi-ubf-${day}-a`, name: "Poha", cost: 12, maxQuantity: 2 },
          { id: `mi-ubf-${day}-b`, name: "Upma", cost: 10, maxQuantity: 2 },
          { id: `mi-ubf-${day}-c`, name: "Banana", cost: 5, maxQuantity: 3 },
          { id: `mi-ubf-${day}-d`, name: "Milk", cost: 10, maxQuantity: 3 },
        ],
        date: dateStr,
        bookingStart: "06:00",
        bookingEnd: "09:00",
        maxQuota: 200,
        bookedCount: 0,
        isOpen: true,
      },
      {
        id: `meal-up-ln-${day}`,
        type: "Lunch",
        menuItems: [
          { id: `mi-uln-${day}-a`, name: "Biryani", cost: 35, maxQuantity: 1 },
          { id: `mi-uln-${day}-b`, name: "Raita", cost: 8, maxQuantity: 2 },
          { id: `mi-uln-${day}-c`, name: "Salad", cost: 5, maxQuantity: 2 },
          { id: `mi-uln-${day}-d`, name: "Water", cost: 0, maxQuantity: 5 },
        ],
        date: dateStr,
        bookingStart: "11:00",
        bookingEnd: "14:00",
        maxQuota: 250,
        bookedCount: 0,
        isOpen: true,
      },
      {
        id: `meal-up-dn-${day}`,
        type: "Dinner",
        menuItems: [
          { id: `mi-udn-${day}-a`, name: "Naan (2 pcs)", cost: 14, maxQuantity: 2 },
          { id: `mi-udn-${day}-b`, name: "Chole Masala", cost: 20, maxQuantity: 2 },
          { id: `mi-udn-${day}-c`, name: "Jeera Rice", cost: 15, maxQuantity: 2 },
          { id: `mi-udn-${day}-d`, name: "Lassi", cost: 12, maxQuantity: 2 },
        ],
        date: dateStr,
        bookingStart: "18:00",
        bookingEnd: "21:00",
        maxQuota: 220,
        bookedCount: 0,
        isOpen: true,
      }
    )
  }
  
  return menus
}

export const mockUpcomingMeals = generateUpcomingMeals()

export const mockTokens: MealToken[] = [
  {
    id: "TKN-20260214-BF-001",
    studentId: "STU001",
    mealType: "Breakfast",
    status: "VALID",
    qrCode: "QR-BF-001-VALID",
    bookedItems: [
      { itemId: "mi-1a", name: "Idli (2 pcs)", cost: 15, quantity: 1 },
      { itemId: "mi-1d", name: "Tea/Coffee", cost: 10, quantity: 1 },
    ],
    totalCost: 25,
    createdAt: new Date("2026-02-14T06:30:00"),
    expiresAt: new Date("2026-02-14T09:00:00"),
  },
  {
    id: "TKN-20260214-LN-001",
    studentId: "STU001",
    mealType: "Lunch",
    status: "USED",
    qrCode: "QR-LN-001-USED",
    bookedItems: [
      { itemId: "mi-2a", name: "Rice", cost: 15, quantity: 1 },
      { itemId: "mi-2b", name: "Dal Fry", cost: 12, quantity: 1 },
      { itemId: "mi-2f", name: "Buttermilk", cost: 8, quantity: 1 },
    ],
    totalCost: 35,
    createdAt: new Date("2026-02-14T11:15:00"),
    expiresAt: new Date("2026-02-14T14:00:00"),
    scannedAt: new Date("2026-02-14T12:30:00"),
    counter: "Counter 1 (Veg)",
  },
  {
    id: "TKN-20260213-DN-001",
    studentId: "STU001",
    mealType: "Dinner",
    status: "EXPIRED",
    qrCode: "QR-DN-001-EXP",
    bookedItems: [
      { itemId: "mi-3a", name: "Chapati (3 pcs)", cost: 12, quantity: 1 },
    ],
    totalCost: 12,
    createdAt: new Date("2026-02-13T18:00:00"),
    expiresAt: new Date("2026-02-13T21:00:00"),
  },
]

function generateMockPreBookings(): PreBooking[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const d1 = new Date(today)
  d1.setDate(today.getDate() + 1)
  const d2 = new Date(today)
  d2.setDate(today.getDate() + 2)
  const d3 = new Date(today)
  d3.setDate(today.getDate() + 3)

  const d1Str = toLocalDateString(d1)
  const d2Str = toLocalDateString(d2)
  const d3Str = toLocalDateString(d3)

  const idDate1 = d1Str.replace(/-/g, '')
  const idDate2 = d2Str.replace(/-/g, '')
  const idDate3 = d3Str.replace(/-/g, '')

  return [
    {
      id: `PBK-${idDate1}-BF-001`,
      studentId: "STU001",
      mealDate: d1Str,
      mealType: "Breakfast",
      bookedItems: [
        { itemId: "mi-ubf-1-a", name: "Poha", cost: 12, quantity: 1 },
        { itemId: "mi-ubf-1-d", name: "Milk", cost: 10, quantity: 1 },
      ],
      totalCost: 22,
      status: "PENDING",
      createdAt: new Date(),
    },
    {
      id: `PBK-${idDate2}-LN-001`,
      studentId: "STU001",
      mealDate: d2Str,
      mealType: "Lunch",
      bookedItems: [
        { itemId: "mi-uln-2-a", name: "Biryani", cost: 35, quantity: 1 },
        { itemId: "mi-uln-2-b", name: "Raita", cost: 8, quantity: 1 },
      ],
      totalCost: 43,
      status: "PENDING",
      createdAt: new Date(),
    },
    {
      id: `PBK-${idDate3}-DN-001`,
      studentId: "STU001",
      mealDate: d3Str,
      mealType: "Dinner",
      bookedItems: [
        { itemId: "mi-udn-3-a", name: "Naan (2 pcs)", cost: 14, quantity: 1 },
        { itemId: "mi-udn-3-b", name: "Chole Masala", cost: 20, quantity: 1 },
      ],
      totalCost: 34,
      status: "ACTIVE",
      createdAt: new Date(),
    },
  ]
}

export const mockPreBookings: PreBooking[] = generateMockPreBookings()

export const mockCounters: Counter[] = [
  { id: "c1", name: "Counter 1", type: "Veg", isActive: true, tokensServed: 87, assignedStaff: "Ravi S." },
  { id: "c2", name: "Counter 2", type: "Non-Veg", isActive: true, tokensServed: 53, assignedStaff: "Meena K." },
  { id: "c3", name: "Counter 3", type: "Special", isActive: false, tokensServed: 0, assignedStaff: null },
]

export const mockStaff: StaffMember[] = [
  { id: "staff-1", name: "Ravi Shankar", employeeNumber: "EMP001", assignedCounter: "c1" },
  { id: "staff-2", name: "Meena Kumari", employeeNumber: "EMP002", assignedCounter: "c2" },
  { id: "staff-3", name: "Suresh Babu", employeeNumber: "EMP003", assignedCounter: null },
]

export const mockAllStudents: Student[] = [
  { ...mockStudent },
  {
    id: "STU002",
    name: "Priya Sharma",
    registerNumber: "21BCE5678",
    hostel: "Women's Hostel Block B",
    room: "B-210",
    photoUrl: "/placeholder-student.jpg",
    email: "priya.sharma@college.edu",
    phone: "+91 98765 43211",
    password: "password123",
  },
  {
    id: "STU003",
    name: "Rahul Menon",
    registerNumber: "21BCE9012",
    hostel: "Men's Hostel Block A",
    room: "A-112",
    photoUrl: "/placeholder-student.jpg",
    email: "rahul.menon@college.edu",
    phone: "+91 98765 43212",
    password: "password123",
  },
  {
    id: "STU004",
    name: "Sneha Reddy",
    registerNumber: "21BCE3456",
    hostel: "Women's Hostel Block A",
    room: "A-405",
    photoUrl: "/placeholder-student.jpg",
    email: "sneha.reddy@college.edu",
    phone: "+91 98765 43213",
    password: "password123",
  },
  {
    id: "STU005",
    name: "Vikram Patel",
    registerNumber: "21BCE7890",
    hostel: "Men's Hostel Block B",
    room: "B-301",
    photoUrl: "/placeholder-student.jpg",
    email: "vikram.patel@college.edu",
    phone: "+91 98765 43214",
    password: "password123",
  },
]

export const mockStudentPayments: StudentPayment[] = [
  {
    studentId: "STU001",
    studentName: "Arjun Kumar",
    registerNumber: "21BCE1234",
    photoUrl: "/placeholder-student.jpg",
    totalMeals: 42,
    breakfastCount: 14,
    lunchCount: 15,
    dinnerCount: 13,
    totalAmount: 3150,
    paymentStatus: "Not Paid",
    lastPaymentDate: null,
  },
  {
    studentId: "STU002",
    studentName: "Priya Sharma",
    registerNumber: "21BCE5678",
    photoUrl: "/placeholder-student.jpg",
    totalMeals: 38,
    breakfastCount: 12,
    lunchCount: 14,
    dinnerCount: 12,
    totalAmount: 2850,
    paymentStatus: "Not Paid",
    lastPaymentDate: null,
  },
  {
    studentId: "STU003",
    studentName: "Rahul Menon",
    registerNumber: "21BCE9012",
    photoUrl: "/placeholder-student.jpg",
    totalMeals: 45,
    breakfastCount: 15,
    lunchCount: 15,
    dinnerCount: 15,
    totalAmount: 3375,
    paymentStatus: "Paid",
    lastPaymentDate: "2026-02-10",
  },
  {
    studentId: "STU004",
    studentName: "Sneha Reddy",
    registerNumber: "21BCE3456",
    photoUrl: "/placeholder-student.jpg",
    totalMeals: 30,
    breakfastCount: 10,
    lunchCount: 10,
    dinnerCount: 10,
    totalAmount: 2250,
    paymentStatus: "Not Paid",
    lastPaymentDate: null,
  },
  {
    studentId: "STU005",
    studentName: "Vikram Patel",
    registerNumber: "21BCE7890",
    photoUrl: "/placeholder-student.jpg",
    totalMeals: 20,
    breakfastCount: 5,
    lunchCount: 8,
    dinnerCount: 7,
    totalAmount: 1500,
    paymentStatus: "Paid",
    lastPaymentDate: "2026-02-12",
  },
]

export const mockStudentBilling = {
  totalAmount: 3150,
  paymentStatus: "Not Paid" as PaymentStatus,
  breakdown: [
    { meal: "Breakfast", count: 14, amount: 630 },
    { meal: "Lunch", count: 15, amount: 1125 },
    { meal: "Dinner", count: 13, amount: 715 },
  ] as { meal: string; count: number; amount: number }[],
  paymentHistory: [
    { id: "pay-1", date: "2026-01-31", amount: 2800, status: "Paid" as PaymentStatus },
    { id: "pay-2", date: "2025-12-31", amount: 2650, status: "Paid" as PaymentStatus },
  ] as PaymentHistoryEntry[],
}

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log-1",
    action: "Token Generated",
    user: "Arjun Kumar (21BCE1234)",
    role: "student",
    details: "Breakfast token TKN-20260214-BF-001 generated (Rice, Buttermilk, Dal Fry)",
    timestamp: new Date("2026-02-14T06:30:00"),
  },
  {
    id: "log-2",
    action: "Token Scanned",
    user: "Staff - Counter 1",
    role: "staff",
    details: "Token TKN-20260214-LN-001 verified at Counter 1 (Veg)",
    timestamp: new Date("2026-02-14T12:30:00"),
  },
  {
    id: "log-3",
    action: "Duplicate Scan",
    user: "Staff - Counter 2",
    role: "staff",
    details: "Duplicate scan attempt for TKN-20260214-LN-001",
    timestamp: new Date("2026-02-14T12:31:00"),
  },
  {
    id: "log-4",
    action: "Meal Published",
    user: "Admin - Hostel Warden",
    role: "admin",
    details: "Lunch meal published with quota 250",
    timestamp: new Date("2026-02-14T10:00:00"),
  },
  {
    id: "log-5",
    action: "Manual Override",
    user: "Admin - Hostel Warden",
    role: "admin",
    details: "Emergency override for STU045 - Scanner malfunction",
    timestamp: new Date("2026-02-14T13:15:00"),
  },
  {
    id: "log-6",
    action: "Quota Updated",
    user: "Admin - Hostel Warden",
    role: "admin",
    details: "Dinner quota increased from 200 to 220",
    timestamp: new Date("2026-02-14T17:00:00"),
  },
  {
    id: "log-7",
    action: "Token Expired",
    user: "System",
    role: "admin",
    details: "Token TKN-20260213-DN-001 auto-expired",
    timestamp: new Date("2026-02-13T21:00:00"),
  },
  {
    id: "log-8",
    action: "Token Cancelled",
    user: "Priya Sharma (21BCE5678)",
    role: "student",
    details: "Breakfast token TKN-20260214-BF-002 cancelled by student",
    timestamp: new Date("2026-02-14T07:45:00"),
  },
  {
    id: "log-9",
    action: "Payment Updated",
    user: "Admin - Hostel Warden",
    role: "admin",
    details: "Marked payment as Paid for Rahul Menon (21BCE9012) - Rs.3375",
    timestamp: new Date("2026-02-10T16:00:00"),
  },
  {
    id: "log-10",
    action: "Student Created",
    user: "Admin - Hostel Warden",
    role: "admin",
    details: "New student account created for Vikram Patel (21BCE7890)",
    timestamp: new Date("2026-02-01T09:00:00"),
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    message: "Breakfast booking is now open!",
    type: "info",
    timestamp: new Date("2026-02-14T06:00:00"),
    read: true,
  },
  {
    id: "n2",
    message: "Your lunch token has been verified successfully.",
    type: "success",
    timestamp: new Date("2026-02-14T12:30:00"),
    read: false,
  },
  {
    id: "n3",
    message: "Dinner quota is full. No more bookings available.",
    type: "warning",
    timestamp: new Date("2026-02-14T19:30:00"),
    read: false,
  },
  {
    id: "n4",
    message: "Duplicate scan attempt detected at Counter 2.",
    type: "error",
    timestamp: new Date("2026-02-14T12:31:00"),
    read: false,
  },
  {
    id: "n5",
    message: "Your billing total is Rs.3150. Payment pending.",
    type: "warning",
    timestamp: new Date("2026-02-14T08:00:00"),
    read: true,
  },
]

// Chart data for admin analytics
export const mealParticipationData = [
  { day: "Mon", breakfast: 165, lunch: 210, dinner: 190 },
  { day: "Tue", breakfast: 170, lunch: 220, dinner: 185 },
  { day: "Wed", breakfast: 155, lunch: 205, dinner: 195 },
  { day: "Thu", breakfast: 180, lunch: 230, dinner: 200 },
  { day: "Fri", breakfast: 142, lunch: 189, dinner: 175 },
  { day: "Sat", breakfast: 120, lunch: 160, dinner: 155 },
  { day: "Sun", breakfast: 130, lunch: 175, dinner: 165 },
]

export const monthlyRevenueData = [
  { month: "Sep", revenue: 185000 },
  { month: "Oct", revenue: 210000 },
  { month: "Nov", revenue: 195000 },
  { month: "Dec", revenue: 175000 },
  { month: "Jan", revenue: 220000 },
  { month: "Feb", revenue: 148500 },
]

export const tokenStatusData = [
  { name: "Used", value: 685, fill: "hsl(var(--chart-2))" },
  { name: "Expired", value: 98, fill: "hsl(var(--chart-4))" },
  { name: "Cancelled", value: 42, fill: "hsl(var(--chart-3))" },
  { name: "Active", value: 35, fill: "hsl(var(--chart-1))" },
]

export const peakServingData = [
  { time: "7:00", count: 12 },
  { time: "7:30", count: 45 },
  { time: "8:00", count: 78 },
  { time: "8:30", count: 35 },
  { time: "12:00", count: 20 },
  { time: "12:30", count: 65 },
  { time: "13:00", count: 95 },
  { time: "13:30", count: 42 },
  { time: "19:00", count: 15 },
  { time: "19:30", count: 55 },
  { time: "20:00", count: 82 },
  { time: "20:30", count: 30 },
]

// Helper: get meal cost
export function getMealCost(meal: Meal): number {
  const menuItems = (meal as any)?.menuItems
  if (!Array.isArray(menuItems)) {
    return 0
  }

  return menuItems.reduce((sum: number, item: any) => sum + (Number(item?.cost) || 0), 0)
}
