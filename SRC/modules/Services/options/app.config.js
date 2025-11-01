// Application-wide configuration
export default {
  // Application info
  app: {
    name: 'Reciplore',
    version: '1.0.0',
    description: 'Recipe Discovery and Management Platform',
    url: process.env.APP_URL || 'https://reciplore.app'
  },

  // Pagination settings
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    defaultPage: 1
  },

  // File upload settings
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedDocumentTypes: ['application/pdf'],
    maxFilesPerUpload: 10
  },

  // Security settings
  security: {
    bcryptRounds: 12,
    jwtExpiresIn: '7d',
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Email settings
  email: {
    from: process.env.EMAIL_FROM || 'noreply@reciplore.app',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@reciplore.app'
  },

  // Cache settings
  cache: {
    defaultTTL: 3600, // 1 hour
    maxKeys: 1000
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxFiles: 5,
    maxSize: '10m'
  }
};