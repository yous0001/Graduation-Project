// Application defaults configuration
export default {
  // Coupon defaults
  coupon: {
    defaultUsageLimit: 10,
    maxUsageLimit: 1000
  },

  // Order defaults
  order: {
    defaultStatus: 'pending',
    maxItemsPerOrder: 50
  },

  // User defaults
  user: {
    defaultRole: 'user',
    maxAddressesPerUser: 5
  },

  // Recipe defaults
  recipe: {
    maxIngredientsPerRecipe: 50,
    maxInstructionsPerRecipe: 20,
    defaultServings: 4
  },

  // Review defaults
  review: {
    minRating: 1,
    maxRating: 5,
    defaultRating: 5
  },

  // Cart defaults
  cart: {
    maxItemsPerCart: 100,
    defaultQuantity: 1
  },

  // Banner defaults
  banner: {
    defaultDisplayOrder: 0,
    maxBannersActive: 10
  }
};