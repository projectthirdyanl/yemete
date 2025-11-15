'use client'

import { useTheme } from '@/contexts/ThemeContext'

type LogoSize = 'small' | 'default' | 'large'

const tileDimensions: Record<LogoSize, string> = {
  small: 'h-12 w-12 text-[9px]',
  default: 'h-16 w-16 text-[11px]',
  large: 'h-20 w-20 text-sm',
}

const labelSizes: Record<LogoSize, string> = {
  small: 'text-sm',
  default: 'text-lg',
  large: 'text-xl',
}

export default function Logo({ size = 'default' }: { size?: LogoSize }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-4">
      {/* Glowing circular tile */}
      <div className="relative group">
        {/* Outer glow layers for more intensity */}
        <div
          className={`absolute inset-0 blur-3xl rounded-full animate-pulse ${
            isDark
              ? 'bg-yametee-red/60 group-hover:bg-yametee-red/80'
              : 'bg-yametee-red/40 group-hover:bg-yametee-red/50'
          } transition-all duration-300`}
        />
        <div
          className={`absolute inset-0 blur-xl rounded-full ${
            isDark ? 'bg-yametee-red/50' : 'bg-yametee-red/35'
          }`}
        />
        
        {/* Main tile */}
        <div
          className={`
            relative rounded-full flex flex-col items-center justify-center font-heading font-black
            ${tileDimensions[size]}
            ${isDark 
              ? 'bg-gradient-to-br from-yametee-red via-yametee-red to-yametee-redDark text-white shadow-[0_0_50px_rgba(255,59,48,0.7),0_0_100px_rgba(255,59,48,0.4)]' 
              : 'bg-gradient-to-br from-yametee-red via-yametee-red to-yametee-redDark text-white shadow-[0_8px_40px_rgba(255,59,48,0.5),0_0_60px_rgba(255,59,48,0.3)]'
            }
            border-2 border-white/30
            group-hover:scale-105 transition-transform duration-300
            backdrop-blur-sm
          `}
        >
          <span className="leading-tight">YAME</span>
          <span className="leading-tight">TEE</span>
        </div>
      </div>

      {/* Text labels */}
      <div className="flex flex-col">
        <span
          className={`font-heading font-bold tracking-[0.15em] uppercase ${labelSizes[size]} ${
            isDark ? 'text-white' : 'text-yametee-foreground'
          }`}
        >
          YAME TEE
        </span>
        {size !== 'small' && (
          <span
            className={`text-[11px] uppercase tracking-[0.35em] mt-0.5 ${
              isDark ? 'text-white/70' : 'text-yametee-muted'
            }`}
          >
            STREET UNIFORM
          </span>
        )}
      </div>
    </div>
  )
}

