'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  fullScreen?: boolean
  message?: string
}

export default function LoadingSpinner({
  size = 'default',
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const sizeClasses = {
    small: {
      container: 'h-12 w-12 text-[9px]',
      text: 'text-sm',
      dots: 'w-1 h-1',
    },
    default: {
      container: 'h-16 w-16 text-[11px]',
      text: 'text-lg',
      dots: 'w-1.5 h-1.5',
    },
    large: {
      container: 'h-20 w-20 text-sm',
      text: 'text-xl',
      dots: 'w-2 h-2',
    },
  }

  const currentSize = sizeClasses[size]

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Brand Logo with Bouncing Animation */}
      <div className="relative">
        {/* Outer glow */}
        <div
          className={`absolute inset-0 blur-3xl rounded-full animate-pulse ${
            isDark ? 'bg-yametee-red/60' : 'bg-yametee-red/40'
          } transition-all duration-300`}
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        <div
          className={`absolute inset-0 blur-xl rounded-full ${
            isDark ? 'bg-yametee-red/50' : 'bg-yametee-red/35'
          }`}
        />

        {/* Main tile with bounce */}
        <div
          className={`
            relative rounded-full flex flex-col items-center justify-center font-heading font-black
            ${currentSize.container}
            ${
              isDark
                ? 'bg-gradient-to-br from-yametee-red via-yametee-red to-yametee-redDark text-white shadow-[0_0_50px_rgba(255,59,48,0.7),0_0_100px_rgba(255,59,48,0.4)]'
                : 'bg-gradient-to-br from-yametee-red via-yametee-red to-yametee-redDark text-white shadow-[0_8px_40px_rgba(255,59,48,0.5),0_0_60px_rgba(255,59,48,0.3)]'
            }
            border-2 border-white/30
            backdrop-blur-sm
          `}
          style={{
            animation: 'bounce-smooth 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
          }}
        >
          <span className="leading-tight">YAME</span>
          <span className="leading-tight">TEE</span>
        </div>
      </div>

      {/* Loading Dots */}
      <div className="flex items-center gap-2">
        <div
          className={`${currentSize.dots} rounded-full bg-yametee-red`}
          style={{
            animationDelay: '0s',
            animation: 'bounce-dots 1.4s ease-in-out infinite',
          }}
        />
        <div
          className={`${currentSize.dots} rounded-full bg-yametee-red`}
          style={{
            animationDelay: '0.2s',
            animation: 'bounce-dots 1.4s ease-in-out infinite',
          }}
        />
        <div
          className={`${currentSize.dots} rounded-full bg-yametee-red`}
          style={{
            animationDelay: '0.4s',
            animation: 'bounce-dots 1.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Optional Message */}
      {message && (
        <p
          className={`${currentSize.text} font-medium text-gray-600 dark:text-gray-400 animate-pulse`}
        >
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-yametee-dark px-4">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center p-8">{content}</div>
}
