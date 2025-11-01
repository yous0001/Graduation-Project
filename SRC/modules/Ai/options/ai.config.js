// AI module configuration
export default {
  // API endpoints
  endpoints: {
    huggingFace: {
      recipeGeneration: 'https://api-inference.huggingface.co/models/flax-community/t5-recipe-generation',
      dutRecipeGenerator: 'https://api-inference.huggingface.co/models/Ashikan/dut-recipe-generator',
      gpt2: 'https://api-inference.huggingface.co/models/gpt2',
      stableDiffusion: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      fluxDev: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
      flux: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev'
    },
    openAI: {
      imageGeneration: 'https://api.openai.com/v1/images/generations'
    },
    flask: {
      recommend: 'http://127.0.0.1:5000/recommend'
    }
  },

  // Retry and timeout settings
  retry: {
    maxRetries: 2,
    maxAttempts: 3,
    imageGenerationRetries: 2
  },

  // API limits and settings
  limits: {
    maxGeminiKeys: 5, // Limit to GEMINI_API_KEY1 through GEMINI_API_KEY5
    maxHuggingFaceKeys: 10, // Limit to HUGGINGFACE_TOKEN1 through HUGGINGFACE_TOKEN10
    maxDietPlanDays: 30,
    maxDaysInPdf: 10
  },

  // Default values
  defaults: {
    placeholderImage: 'https://via.placeholder.com/800x400?text=Recipe+Image',
    defaultRecipeImage: 'https://res.cloudinary.com/dfdmgqhwa/image/upload/v1750061556/recipesSystem/photo_2025-06-06_10-19-34_szrjgs.jpg',
    appLink: process.env.APP_LINK || 'https://reciplore.app'
  },

  // PDF generation settings
  pdf: {
    defaultUserData: {
      weight: 80,
      height: 175,
      age: 25,
      gender: 'male',
      fatPercentage: 15
    },
    proteinRequirements: {
      minProteinRatio: 1.4, // grams per kg body weight
      optimalProteinRatio: 1.6 // grams per kg body weight
    },
    calculations: {
      muscleGainMultiplier: 0.9,
      fatLossMultiplierHigh: 1.3,
      fatLossMultiplierLow: 1.2,
      daysInMonth: 30,
      daysInMonthAdjusted: 30.42,
      caloriesPerKgFat: 7700,
      maxFatLossKg: 3,
      maxFatLossDaily: 0.5
    },
    layout: {
      fontSize: 10,
      lineSpacing: 5,
      sectionSpacing: 10,
      pageMargin: 95
    }
  },

  // HTTP status codes for error handling
  httpStatus: {
    rateLimited: 429,
    gatewayTimeout: 504,
    serviceUnavailable: 503
  }
};