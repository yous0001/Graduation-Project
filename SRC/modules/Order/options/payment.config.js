// Payment module configuration
export default {
  // Stripe configuration
  stripe: {
    currency: 'EGP',
    fallbackCurrency: 'USD',
    multiplier: 100, // Convert to smallest currency unit (piastres/cents)
    successUrl: process.env.SUCCESS_URL || '/payment/success',
    cancelUrl: process.env.CANCEL_URL || '/payment/cancel'
  },

  // Payment methods
  methods: {
    cash: 'cash',
    card: 'card',
    stripe: 'stripe',
    paypal: 'paypal'
  },

  // Currency configurations
  currencies: {
    EGP: {
      code: 'EGP',
      symbol: '£',
      name: 'Egyptian Pound',
      multiplier: 100
    },
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      multiplier: 100
    }
  },

  // Payment limits
  limits: {
    minAmount: 1, // Minimum payment amount
    maxAmount: 50000, // Maximum payment amount
    maxRetries: 3
  },

  // Error status codes
  errorCodes: {
    invalidPayment: 400,
    paymentFailed: 402,
    serviceUnavailable: 503
  },

  // Default settings
  defaults: {
    currency: 'EGP',
    paymentMethod: 'cash'
  }
};