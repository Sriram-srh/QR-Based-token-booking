/**
 * Test data and utilities for development
 * These credentials are only for development testing
 */

export const TEST_CREDENTIALS = {
  students: [
    { email: 'student1@example.com', password: 'password123', name: 'Alice Johnson' },
    { email: 'student2@example.com', password: 'password123', name: 'Bob Smith' },
    { email: 'student3@example.com', password: 'password123', name: 'Carol White' }
  ],
  staff: [
    { email: 'staff1@example.com', password: 'password123', name: 'John Counter' },
    { email: 'staff2@example.com', password: 'password123', name: 'Jane Meals' }
  ],
  admin: [
    { email: 'admin@example.com', password: 'password123', name: 'Admin User' }
  ]
}

export const TEST_MEALS = [
  {
    name: 'South Indian Special',
    mealType: 'Breakfast',
    items: ['Idli', 'Sambar', 'Chutney'],
    price: 50
  },
  {
    name: 'Lunch Combo',
    mealType: 'Lunch',
    items: ['Rice', 'Dal', 'Vegetable Curry', 'Pickle'],
    price: 80
  },
  {
    name: 'Evening Snacks',
    mealType: 'Dinner',
    items: ['Dosa', 'Sambar', 'Tea'],
    price: 60
  }
]

export const QR_TEST_DATA = {
  validQR: 'TOKEN:1234567890:student-uuid:Breakfast',
  invalidQR: 'INVALID:DATA',
  expiredQR: 'TOKEN:0:student-uuid:Lunch'
}

// Utility to generate test QR code data
export function generateTestQRData(studentId: string, mealType: string): string {
  return `TOKEN:${Date.now()}:${studentId}:${mealType}`
}

// Utility to format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Utility to check if token is expired
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

// Utility to get days until expiry
export function daysUntilExpiry(expiresAt: string): number {
  const expiryDate = new Date(expiresAt)
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Utility to validate email
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Utility to validate QR code format
export function isValidQRFormat(qrCode: string): boolean {
  return qrCode.startsWith('TOKEN:') && qrCode.split(':').length === 4
}
