/**
 * Monitoring middleware for Next.js
 * Tracks request metrics and sends alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from './lib/monitoring'

export function monitoringMiddleware(request: NextRequest) {
  const startTime = Date.now()
  const url = request.nextUrl.pathname

  // Track request after response
  return {
    track: (response: NextResponse) => {
      const duration = Date.now() - startTime
      const success = response.status < 400
      
      monitoring.trackRequest(success, duration, url)
      
      // Add custom headers for monitoring
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Request-ID', crypto.randomUUID())
      
      return response
    },
  }
}
