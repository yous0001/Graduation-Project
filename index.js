import express from "express";
import { config } from "dotenv";
import compression from "compression";
import cors from "cors";
import mongoose from "mongoose";
import db_connection, { getLastDbError } from "./DB/connnection.js";
import authRouter from "./SRC/modules/Auth/auth.router.js";
import categoryRouter from "./SRC/modules/Category/category.router.js";
import countryRouter from "./SRC/modules/Country/country.router.js";
import ingredientRouter from "./SRC/modules/Ingredient/ingredient.router.js";
import receipeRouter from "./SRC/modules/Recipe/recipe.router.js";
import cartRouter from "./SRC/modules/Cart/cart.routes.js";
import bannerRouter from "./SRC/modules/Banner/banners.routes.js";
import reviewRouter from "./SRC/modules/Review/reviews.routes.js";
import aiRouter from "./SRC/modules/Ai/ai.routes.js";
import orderRouter from "./SRC/modules/Order/order.router.js";
import recommendationRouter from "./SRC/modules/Recommendations/recommendation.routes.js";
import addressRouter from "./SRC/modules/Address/address.routes.js";
import couponRouter from "./SRC/modules/Coupon/coupon.routes.js";
import { globalResponse } from "./SRC/middlewares/globalResponce.js";
import { cloudinaryConfig } from "./SRC/utils/cloudinary.utils.js";

// Load environment configuration
config();
if (process.env.NODE_ENV !== "production") {
  config({ path: "./config/dev.env" });
}

const app = express();
const port = Number(process.env.PORT) || 5000;

// Enable gzip/deflate compression for high throughput and reduced latency
app.use(compression());

// CORS configuration supporting credentials and custom headers
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "accessToken",
      "accesstoken",
      "refreshtoken",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health and monitoring endpoints
app.get(["/health", "/api/health"], async (req, res) => {
  await db_connection();
  const readyState = mongoose.connection.readyState;
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor(process.uptime()),
    dbConnected: readyState === 1,
    dbState: readyState,
    dbError: readyState === 1 ? null : getLastDbError(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/test", (req, res) => {
  res.json({ message: "test endpoint" });
});

app.get("/test-upload", async (req, res) => {
  try {
    const result = await cloudinaryConfig().api.ping();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ensure database connection is ready before handling API routes (essential for serverless cold starts)
app.use(async (req, res, next) => {
  await db_connection();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
      error: getLastDbError(),
    });
  }
  next();
});

// Application API routes
app.use("/auth", authRouter);
app.use("/category", categoryRouter);
app.use("/country", countryRouter);
app.use("/ingredient", ingredientRouter);
app.use("/recipe", receipeRouter);
app.use("/cart", cartRouter);
app.use("/banner", bannerRouter);
app.use("/review", reviewRouter);
app.use("/ai", aiRouter);
app.use("/recommendation", recommendationRouter);
app.use("/order", orderRouter);
app.use("/address", addressRouter);
app.use("/coupon", couponRouter);

// 404 handler for unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// Centralized error handling middleware (must be after all routes)
app.use(globalResponse);

// Initialize database connection
db_connection();

if (process.env.NODE_ENV !== "test" && process.env.APP_DISABLE_LISTEN !== "true") {
  app.listen(port, () => {
    console.log(`Reciplore backend running on port ${port}`);
  });
}

export default app;
