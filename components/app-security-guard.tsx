'use client'

import { useEffect } from 'react'

export function AppSecurityGuard() {
  useEffect(() => {
    const blockCopyAndContextMenu = (event: Event) => {
      event.preventDefault()
    }

    document.addEventListener('copy', blockCopyAndContextMenu)
    document.addEventListener('contextmenu', blockCopyAndContextMenu)

    return () => {
      document.removeEventListener('copy', blockCopyAndContextMenu)
      document.removeEventListener('contextmenu', blockCopyAndContextMenu)
    }
  }, [])

  return null
}
