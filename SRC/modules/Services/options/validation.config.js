// Validation configuration
export default {
  // String length constraints
  strings: {
    username: { min: 3, max: 30 },
    email: { min: 5, max: 255 },
    password: { min: 8, max: 128 },
    name: { min: 2, max: 100 },
    description: { min: 10, max: 1000 },
    title: { min: 3, max: 200 },
    address: { min: 10, max: 500 },
  },

  // Numeric constraints
  numbers: {
    rating: { min: 1, max: 5 },
    price: { min: 0, max: 999999 },
    quantity: { min: 1, max: 1000 },
    stock: { min: 0, max: 999999 },
    discount: { min: 0, max: 100 },
    age: { min: 13, max: 120 },
    weight: { min: 30, max: 300 },
    height: { min: 100, max: 250 },
  },

  // Array constraints
  arrays: {
    ingredients: { min: 1, max: 50 },
    instructions: { min: 1, max: 20 },
    recipeInstructions: { min: 7, max: 10 }, // For AI-generated recipes
    tags: { min: 0, max: 10 },
    images: { min: 0, max: 5 },
  },

  // Regular expressions
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-()]{10,15}$/,
    url: /^https?:\/\/.+/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    color: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  },

  // Default error messages
  messages: {
    required: "This field is required",
    email: "Please enter a valid email address",
    minLength: "Must be at least {min} characters long",
    maxLength: "Must not exceed {max} characters",
    min: "Must be at least {min}",
    max: "Must not exceed {max}",
    pattern: "Invalid format",
  },
};
