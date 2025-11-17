'use client'

import { memo } from 'react'
import { Toast, type ToastType } from './Toast'
import { useToast } from '@/contexts/ToastContext'

/**
 * ToastContainer - Container for toast notifications
 * Place this once in your root layout
 */
export const ToastContainer = memo(function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  )
})

ToastContainer.displayName = 'ToastContainer'
