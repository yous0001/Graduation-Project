// Order module configuration
export default {
  // Tax and fees
  vat: {
    rate: 14, // VAT percentage
    description: 'Value Added Tax'
  },

  // Shipping configuration
  shipping: {
    baseFee: 10, // Fee for the first item
    additionalItemFee: 5, // Fee per additional item
    discountPerItem: 0.5, // Discount per item for large orders
    maxDiscount: 0.3, // Maximum discount percentage
    freeShippingThreshold: 500 // Free shipping above this amount
  },

  // Order limits and defaults
  limits: {
    maxItemsPerOrder: 50,
    minOrderAmount: 10,
    maxOrderAmount: 10000
  },

  // Order statuses
  statuses: {
    pending: 'pending',
    confirmed: 'confirmed',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
    refunded: 'refunded'
  },

  // Currency settings
  currency: {
    code: 'EGP',
    symbol: '£',
    name: 'Egyptian Pound'
  },

  // Default values
  defaults: {
    couponDiscount: 0,
    usageLimit: 10
  },

  // Error codes
  errorCodes: {
    invalidRequest: 400,
    notFound: 404,
    serverError: 500,
    unauthorized: 401,
    forbidden: 403
  }
};