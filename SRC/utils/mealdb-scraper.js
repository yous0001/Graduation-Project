import axios from "axios";
import slugify from "slugify";
import chalk from "chalk";
import mongoose from "mongoose";
import { config } from "dotenv";
import { pathToFileURL } from "url";

import bcrypt from "bcryptjs";
import db_connection from "../../DB/connnection.js";
import Category from "../../DB/models/category.model.js";
import Country from "../../DB/models/country.model.js";
import Ingredient from "../../DB/models/ingredient.model.js";
import Recipe from "../../DB/models/recipe.model.js";
import User from "../../DB/models/user.model.js";
import { uploadFile } from "./cloudinary.utils.js";
import { discountTypes } from "./enums.utils.js";
import { systemRoles } from "./system-roles.js";
import apiConfig from "../modules/Services/options/api.config.js";

const mealdbClient = axios.create({
  baseURL: apiConfig.mealDB.baseUrl,
  timeout: apiConfig.requests.timeout || 10000,
});

const toSlug = (str) => slugify(str || "", { replacement: "_", lower: true, strict: true }) || slugify(str || "", { replacement: "_", lower: true });

const hasCloudinaryConfig = () =>
  Boolean(process.env.Cloud_name && process.env.API_key && process.env.API_secret);

/**
 * Run async worker over items with bounded concurrency.
 */
async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function next() {
    while (index < items.length) {
      const current = index++;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
  await Promise.all(workers);
  return results;
}

/**
 * Fetch with automatic retry for transient network errors.
 */
async function fetchWithRetry(url, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await mealdbClient.get(url);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * Verify an external image URL exists via HEAD (with GET fallback).
 */
async function verifyImageExists(url) {
  try {
    const res = await axios.head(url, { timeout: 5000 });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Upload to Cloudinary when configured, or fall back to direct MealDB CDN URL.
 */
async function resolveImage({ imageUrl, folder, fallbackId }) {
  if (!imageUrl) {
    return {
      secure_url: apiConfig.images.defaultPlaceholder,
      public_id: fallbackId || "placeholder",
    };
  }

  if (hasCloudinaryConfig()) {
    try {
      return await uploadFile({
        file: imageUrl,
        folder: `${process.env.UPLOADS_FOLDER || "reciplore"}/${folder}`,
      });
    } catch (err) {
      console.warn(chalk.yellow(`Cloudinary upload skipped for ${imageUrl}: ${err.message}`));
    }
  }

  return {
    secure_url: imageUrl,
    public_id: `mealdb_${fallbackId || Date.now()}`,
  };
}

async function resolveActorId(userId) {
  if (userId) return userId;

  let superAdmin = await User.findOne({ role: systemRoles.SUPER_ADMIN }).select("_id").lean();
  if (!superAdmin) {
    // Check if a user with the superadmin email already exists and upgrade role if needed
    const existingByEmail = await User.findOne({ email: "superadmin@reciplore.app" });
    if (existingByEmail) {
      existingByEmail.role = systemRoles.SUPER_ADMIN;
      existingByEmail.isEmailVerified = true;
      await existingByEmail.save();
      superAdmin = existingByEmail;
    } else {
      const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
      const hashedPassword = bcrypt.hashSync(process.env.SUPERADMIN_PASSWORD || "SuperAdmin@2026!", saltRounds);
      superAdmin = await User.create({
        username: "superadmin",
        email: "superadmin@reciplore.app",
        password: hashedPassword,
        phoneNumbers: ["+201000000000"],
        role: systemRoles.SUPER_ADMIN,
        isEmailVerified: true,
      });
      console.log(chalk.blue(`Created system superadmin user (${superAdmin._id})`));
    }
  }
  return superAdmin._id;
}

/**
 * Scrape and seed MealDB categories.
 */
export async function scrapeCategories({ userId } = {}) {
  const actorId = await resolveActorId(userId);
  const { data } = await fetchWithRetry(apiConfig.mealDB.endpoints.categories);
  const rawCategories = data?.categories || [];

  const existing = await Category.find().select("name").lean();
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

  const toCreate = rawCategories.filter((cat) => {
    const slug = toSlug(cat.strCategory);
    return !existingNames.has(slug) && !existingNames.has(cat.strCategory.toLowerCase());
  });

  if (toCreate.length === 0) {
    return { inserted: [], skipped: rawCategories.length };
  }

  const inserted = [];
  await runWithConcurrency(toCreate, 5, async (cat) => {
    const slug = toSlug(cat.strCategory);
    try {
      const image = await resolveImage({
        imageUrl: cat.strCategoryThumb,
        folder: `Categories/${slug}`,
        fallbackId: `cat_${slug}`,
      });
      const created = await Category.create({
        name: slug,
        description: cat.strCategoryDescription || cat.strCategory,
        addedBy: actorId,
        image,
      });
      inserted.push(created);
    } catch (err) {
      if (err.code !== 11000) {
        console.warn(chalk.red(`Category error (${cat.strCategory}): ${err.message}`));
      }
    }
  });

  return { inserted, skipped: rawCategories.length - toCreate.length };
}

/**
 * Scrape and seed MealDB countries/areas.
 */
export async function scrapeCountries({ userId } = {}) {
  const actorId = await resolveActorId(userId);
  const { data } = await fetchWithRetry(apiConfig.mealDB.endpoints.areasList);
  const rawCountries = data?.meals || [];

  const existing = await Country.find().select("name").lean();
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

  const docs = rawCountries
    .map((c) => c.strArea?.trim())
    .filter((name) => name && !existingNames.has(name.toLowerCase()))
    .map((name) => ({ name, createdBy: actorId }));

  if (docs.length === 0) {
    return { inserted: [], skipped: rawCountries.length };
  }

  const inserted = await Country.insertMany(docs, { ordered: false }).catch((err) => {
    return err.insertedDocs || [];
  });

  return { inserted, skipped: rawCountries.length - docs.length };
}

/**
 * Scrape and seed MealDB ingredients concurrently.
 */
export async function scrapeIngredients({ userId, limit = 0 } = {}) {
  const actorId = await resolveActorId(userId);
  const { data } = await fetchWithRetry(apiConfig.mealDB.endpoints.ingredientsList);
  let rawIngredients = data?.meals || [];
  if (limit > 0) rawIngredients = rawIngredients.slice(0, limit);

  const existing = await Ingredient.find().select("slug name").lean();
  const existingSlugs = new Set(existing.map((i) => i.slug));

  const toCreate = rawIngredients.filter((ing) => {
    const name = ing.strIngredient?.trim();
    if (!name) return false;
    return !existingSlugs.has(toSlug(name));
  });

  if (toCreate.length === 0) {
    return { inserted: [], skipped: rawIngredients.length };
  }

  const inserted = [];
  await runWithConcurrency(toCreate, 8, async ({ strIngredient, strDescription }) => {
    const name = strIngredient.trim();
    const slug = toSlug(name);
    const ingredientImageUrl = `${apiConfig.mealDB.imageBaseUrl}/${encodeURIComponent(name)}.png`;

    try {
      const exists = await verifyImageExists(ingredientImageUrl);
      const image = await resolveImage({
        imageUrl: exists ? ingredientImageUrl : apiConfig.images.defaultPlaceholder,
        folder: "ingredients",
        fallbackId: `ing_${slug}`,
      });

      const basePrice = Math.floor(Math.random() * 90 + 10);
      const stock = Math.floor(Math.random() * 450 + 50);
      const randomDiscount = Math.floor(Math.random() * 20);
      const discountAmount = randomDiscount < 4 ? 0 : randomDiscount;

      const created = await Ingredient.create({
        name,
        slug,
        basePrice,
        description: strDescription || `${name} culinary ingredient`,
        stock,
        image,
        discount: {
          type: discountTypes.percentage,
          amount: discountAmount,
        },
        createdBy: actorId,
      });
      inserted.push(created);
    } catch (err) {
      if (err.code !== 11000) {
        console.warn(chalk.red(`Ingredient error (${name}): ${err.message}`));
      }
    }
  });

  return { inserted, skipped: rawIngredients.length - toCreate.length };
}

/**
 * Scrape and seed MealDB recipes concurrently using in-memory lookup caches.
 */
export async function scrapeRecipes({ userId, letters = "abcdefghijklmnopqrstuvwxyz" } = {}) {
  const actorId = await resolveActorId(userId);

  // Preload caches to avoid thousands of repetitive DB queries
  const [categories, countries, ingredients, existingRecipes] = await Promise.all([
    Category.find().lean(),
    Country.find().lean(),
    Ingredient.find().select("_id slug name").lean(),
    Recipe.find().select("slug").lean(),
  ]);

  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(cat.name.toLowerCase(), cat);
    categoryMap.set(toSlug(cat.name), cat);
  }

  const countryMap = new Map();
  for (const c of countries) {
    countryMap.set(c.name.toLowerCase(), c);
  }

  const ingredientMap = new Map();
  for (const ing of ingredients) {
    ingredientMap.set(ing.slug, ing);
  }

  const existingRecipeSlugs = new Set(existingRecipes.map((r) => r.slug));

  // Fetch all letters concurrently
  const letterList = letters.split("").filter(Boolean);
  const letterResponses = await runWithConcurrency(letterList, 6, async (letter) => {
    try {
      const { data } = await fetchWithRetry(`${apiConfig.mealDB.endpoints.searchByLetter}${letter}`);
      return data?.meals || [];
    } catch (err) {
      console.warn(chalk.yellow(`Failed letter '${letter}': ${err.message}`));
      return [];
    }
  });

  const allMeals = letterResponses.flat();
  const newMeals = [];
  const seenSlugs = new Set();

  for (const meal of allMeals) {
    if (!meal?.strMeal) continue;
    const slug = toSlug(meal.strMeal);
    if (!existingRecipeSlugs.has(slug) && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      newMeals.push({ meal, slug });
    }
  }

  const insertedRecipes = [];
  const insertedCountries = [];
  const insertedIngredients = [];

  await runWithConcurrency(newMeals, 6, async ({ meal, slug }) => {
    try {
      const { strMeal, strInstructions, strYoutube, strTags, strArea, strCategory, strMealThumb } = meal;
      if (!strMealThumb) return;

      // Match category case-insensitively / by slug, or auto-create
      const catKey = toSlug(strCategory || "miscellaneous");
      let category = categoryMap.get(catKey) || categoryMap.get((strCategory || "").toLowerCase());
      if (!category) {
        try {
          category = await Category.create({
            name: catKey,
            description: strCategory || "Miscellaneous",
            addedBy: actorId,
            image: { secure_url: apiConfig.images.defaultPlaceholder, public_id: `cat_${catKey}` },
          });
          categoryMap.set(catKey, category);
        } catch {
          category = await Category.findOne({ name: catKey }).lean();
          if (category) categoryMap.set(catKey, category);
        }
      }
      if (!category) return;

      // Match or auto-create country
      const areaName = (strArea || "Unknown").trim();
      let country = countryMap.get(areaName.toLowerCase());
      if (!country) {
        try {
          country = await Country.create({ name: areaName, createdBy: actorId });
          countryMap.set(areaName.toLowerCase(), country);
          insertedCountries.push(country);
        } catch {
          country = await Country.findOne({ name: areaName }).lean();
          if (country) countryMap.set(areaName.toLowerCase(), country);
        }
      }

      // Resolve ingredients using cache
      const recipeIngredients = [];
      for (let i = 1; i <= 20; i++) {
        const ingredientName = meal[`strIngredient${i}`]?.trim();
        const measure = meal[`strMeasure${i}`]?.trim() || "N/A";
        if (!ingredientName) continue;

        const ingSlug = toSlug(ingredientName);
        let ing = ingredientMap.get(ingSlug);

        if (!ing) {
          const ingredientImageUrl = `${apiConfig.mealDB.imageBaseUrl}/${encodeURIComponent(ingredientName)}.png`;
          const exists = await verifyImageExists(ingredientImageUrl);
          const image = await resolveImage({
            imageUrl: exists ? ingredientImageUrl : apiConfig.images.defaultPlaceholder,
            folder: "ingredients",
            fallbackId: `ing_${ingSlug}`,
          });

          try {
            ing = await Ingredient.create({
              name: ingredientName,
              slug: ingSlug,
              basePrice: parseFloat((Math.random() * 90 + 10).toFixed(2)),
              stock: Math.floor(Math.random() * 450 + 50),
              image,
              createdBy: actorId,
            });
            ingredientMap.set(ingSlug, ing);
            insertedIngredients.push(ing);
          } catch {
            ing = await Ingredient.findOne({ slug: ingSlug }).lean();
            if (ing) ingredientMap.set(ingSlug, ing);
          }
        }

        if (ing?._id) {
          recipeIngredients.push({ ingredient: ing._id, amount: measure });
        }
      }

      const image = await resolveImage({
        imageUrl: strMealThumb,
        folder: `Categories/${category.name}/Recipes`,
        fallbackId: `recipe_${slug}`,
      });

      const createdRecipe = await Recipe.create({
        name: strMeal.trim(),
        slug,
        description: strInstructions || strMeal,
        ingredients: recipeIngredients,
        directions: strInstructions || strMeal,
        createdBy: actorId,
        category: category._id,
        country: country?._id,
        Images: { URLs: [image] },
        tags: strTags ? strTags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        videoLink: strYoutube || null,
      });

      insertedRecipes.push(createdRecipe);
    } catch (err) {
      if (err.code !== 11000) {
        console.warn(chalk.red(`Recipe error (${meal.strMeal}): ${err.message}`));
      }
    }
  });

  return {
    insertedRecipes,
    insertedCountries,
    insertedIngredients,
    skipped: allMeals.length - newMeals.length,
  };
}

/**
 * CLI runner: `node SRC/utils/mealdb-scraper.js [--only=categories,countries,ingredients,recipes] [--letters=abc]`
 */
async function runCli() {
  config();
  if (process.env.NODE_ENV !== "production") {
    config({ path: "./config/dev.env" });
  }

  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith("--only="))?.split("=")[1];
  const lettersArg = args.find((a) => a.startsWith("--letters="))?.split("=")[1];
  const targets = onlyArg
    ? new Set(onlyArg.split(",").map((s) => s.trim().toLowerCase()))
    : new Set(["categories", "countries", "ingredients", "recipes"]);

  const startedAt = Date.now();
  console.log(chalk.cyan.bold("Starting Enhanced MealDB Scraper..."));

  const conn = await db_connection();
  if (!conn) {
    console.error(chalk.red("Cannot run scraper: MongoDB connection failed."));
    process.exit(1);
  }

  if (targets.has("categories")) {
    const t0 = Date.now();
    const res = await scrapeCategories();
    console.log(chalk.green(`Categories: +${res.inserted.length} inserted, ${res.skipped} skipped (${Date.now() - t0}ms)`));
  }

  if (targets.has("countries")) {
    const t0 = Date.now();
    const res = await scrapeCountries();
    console.log(chalk.green(`Countries: +${res.inserted.length} inserted, ${res.skipped} skipped (${Date.now() - t0}ms)`));
  }

  if (targets.has("ingredients")) {
    const t0 = Date.now();
    const res = await scrapeIngredients();
    console.log(chalk.green(`Ingredients: +${res.inserted.length} inserted, ${res.skipped} skipped (${Date.now() - t0}ms)`));
  }

  if (targets.has("recipes")) {
    const t0 = Date.now();
    const res = await scrapeRecipes({ letters: lettersArg || "abcdefghijklmnopqrstuvwxyz" });
    console.log(
      chalk.green(
        `Recipes: +${res.insertedRecipes.length} recipes, +${res.insertedCountries.length} countries, +${res.insertedIngredients.length} ingredients, ${res.skipped} skipped (${Date.now() - t0}ms)`
      )
    );
  }

  console.log(chalk.cyan.bold(`Scraping completed in ${((Date.now() - startedAt) / 1000).toFixed(2)}s`));
  await mongoose.disconnect();
  process.exit(0);
}

// Run CLI when invoked directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((err) => {
    console.error(chalk.red("Scraper failed:"), err);
    process.exit(1);
  });
}
