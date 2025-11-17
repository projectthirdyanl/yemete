'use client'

import { memo, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  id: string
  message: string
  type?: ToastType
  duration?: number
  onClose: (id: string) => void
}

/**
 * Toast - Notification component
 *
 * @example
 * ```tsx
 * <Toast
 *   id="1"
 *   message="Item added to cart"
 *   type="success"
 *   onClose={handleClose}
 * />
 * ```
 */
export const Toast = memo(function Toast({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationCircleIcon,
  }

  const styles = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    info: 'bg-blue-500 text-white border-blue-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
  }

  const Icon = icons[type]

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 min-w-[300px] max-w-md animate-fade-in',
        styles[type]
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close notification"
      >
        <XMarkIcon className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
})

Toast.displayName = 'Toast'
