import type { Metadata, Viewport } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import { AppSecurityGuard } from '@/components/app-security-guard'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const _spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' })

export const metadata: Metadata = {
  title: 'SmartMeal QR - Hostel Food Queue & Meal Management',
  description: 'Smart QR-Based Hostel Food Queue, Meal Quota & Serving Management System. Replace physical tokens with secure dynamic QR meal tokens.',
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeInitScript = `
    (function () {
      try {
        var key = 'theme';
        var root = document.documentElement;
        var saved = localStorage.getItem(key);
        var nextTheme = saved === 'dark' || saved === 'light' ? saved : 'light';
        var opposite = nextTheme === 'dark' ? 'light' : 'dark';
        root.classList.remove(opposite);
        root.classList.add(nextTheme);
        if (saved !== nextTheme) {
          localStorage.setItem(key, nextTheme);
        }
      } catch (_err) {
        document.documentElement.classList.add('light');
      }
    })();
  `

  return (
    <html lang="en" className={`${_inter.variable} ${_spaceMono.variable} light`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="theme"
          disableTransitionOnChange
        >
          <AppSecurityGuard />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
