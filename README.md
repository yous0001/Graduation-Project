# 🍳 Reciplore — Backend API

REST API for the Reciplore Recipe Recommendation and Culinary Marketplace platform. Built with Node.js, Express, and MongoDB.

---

## ⚡ Enhancements & Optimizations

- **Database Indexing**: Compound indexes on `Recipe`, `Ingredient`, `Order`, `Review`, and `Cart` collections eliminating full-scan bottlenecks (`COLLSCAN`).
- **HTTP Compression**: Gzip/deflate compression via `compression` middleware.
- **Connection Pooling**: Mongoose connection pooling with `maxPoolSize: 25` and reconnect safeguards.
- **Cart & Order Bug Fixes**:
  - Fixed `ObjectId === string` comparison in Cart controller.
  - Fixed inventory over-decrement in `order.model.js` by scoping stock decrements strictly to `this.isNew`.
  - Added stock restoration on order cancellation.
  - Made `estimatedDeliveryDate` dynamic.
- **Regex Sanitization**: Fixed `api-features.js` keyword and ObjectId substring corruption with word boundaries.
- **Express Middleware Flow**: Corrected route ordering, 404 handler, and `globalResponse` error handler preventing `ERR_HTTP_HEADERS_SENT`.
- **Flexible Auth**: Support for standard `Authorization: Bearer <token>` alongside `accessToken_`, plus optional auth handling so unauthenticated guests can read recipes, market items, categories, and reviews.
- **AI Service Hardening**: Added 6-second timeout to Hugging Face image generation and fallback database search.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended, v22 tested)
- MongoDB instance (Local or MongoDB Atlas)

### Setup
1. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```
2. Copy environment file and configure variables:
   ```bash
   cp .env.example .env
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Health check endpoint: `http://localhost:5000/health`
