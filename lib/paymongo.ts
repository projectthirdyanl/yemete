// PayMongo API integration
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || ''
const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY || ''

export type PaymentMethod = 'gcash' | 'paymaya' | 'card' | 'bank_transfer'

export interface PayMongoCheckoutSession {
  amount: number // in centavos
  description: string
  success_url: string
  failed_url: string
  paymentMethod?: PaymentMethod // Optional: if provided, only show this method
  metadata?: Record<string, any>
}

export interface PayMongoResponse {
  data: {
    id: string
    attributes: {
      checkout_url: string
      amount: number
      status: string
    }
  }
}

/**
 * Map payment method to PayMongo payment method types
 * PayMongo supports: gcash, paymaya, card, and bank_transfer (online banking)
 */
function getPaymentMethodTypes(paymentMethod?: PaymentMethod): string[] {
  if (paymentMethod) {
    // If specific method selected, only show that method
    return [paymentMethod]
  }
  // Default: show all available methods
  return ['gcash', 'paymaya', 'card', 'bank_transfer']
}

export async function createPayMongoCheckout(
  session: PayMongoCheckoutSession
): Promise<PayMongoResponse> {
  const { paymentMethod, metadata, ...sessionData } = session
  const payment_method_types = getPaymentMethodTypes(paymentMethod)

  // PayMongo checkout sessions don't support metadata directly
  // We'll include it in the description or omit it
  const requestBody: {
    data: {
      attributes: {
        amount: number
        description: string
        success_url: string
        failed_url: string
        payment_method_types: string[]
      }
    }
  } = {
    data: {
      attributes: {
        ...sessionData,
        payment_method_types,
      },
    },
  }

  const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let errorMessage = 'Unknown error'
    try {
      const errorData = await response.json()
      errorMessage = errorData?.errors?.[0]?.detail || JSON.stringify(errorData)
    } catch {
      const errorText = await response.text()
      errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
    }
    console.error('PayMongo API error details:', {
      status: response.status,
      statusText: response.statusText,
      error: errorMessage,
      requestBody: JSON.stringify(requestBody, null, 2),
    })
    throw new Error(`PayMongo API error: ${errorMessage}`)
  }

  const result = await response.json()

  // Validate response structure
  if (!result?.data?.attributes?.checkout_url) {
    console.error('Invalid PayMongo response structure:', JSON.stringify(result, null, 2))
    throw new Error('PayMongo returned invalid response structure')
  }

  return result
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // PayMongo webhook signature verification
  // PayMongo sends signature in format: "t=<timestamp>,v1=<hmac_signature>"
  // In production, properly verify HMAC-SHA256 signature
  // For development, we'll accept if webhook secret is set
  if (!secret) {
    return false
  }

  // Basic check - in production, implement proper HMAC verification
  // const crypto = require('crypto')
  // const hmac = crypto.createHmac('sha256', secret)
  // hmac.update(payload)
  // const expectedSignature = hmac.digest('hex')
  // return signature.includes(expectedSignature)

  return true // For now, accept if secret is configured
}
