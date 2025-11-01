// External API configuration
export default {
  // TheMealDB API endpoints
  mealDB: {
    baseUrl: 'https://www.themealdb.com/api/json/v1/1',
    endpoints: {
      searchByLetter: '/search.php?f=',
      filterByIngredient: '/filter.php?i=',
      categories: '/categories.php',
      ingredientsList: '/list.php?i=list',
      areasList: '/list.php?a=list'
    },
    imageBaseUrl: 'https://www.themealdb.com/images/ingredients'
  },

  // Request settings
  requests: {
    timeout: 10000, // 10 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  },

  // Rate limiting
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000
  },

  // Response settings
  response: {
    maxPageSize: 50,
    defaultPageSize: 20,
    maxRecipesPerRequest: 20
  },

  // Image settings
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    defaultPlaceholder: 'https://via.placeholder.com/400x300?text=No+Image'
  }
};