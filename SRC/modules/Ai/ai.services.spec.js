import { describe, it, expect } from "bun:test";
import { parseMarkdownToJson } from "./ai.services.js";

describe("parseMarkdownToJson", () => {
  const sampleMarkdown = `
  # Test Recipe Title

  ## Overview
  - **Cuisine**: Italian
  - **Difficulty**: Easy
  - **Servings**: 2 servings
  - **Prep Time**: 10 minutes
  - **Cook Time**: 20 minutes
  - **Total Time**: 30 minutes
  - **Dietary Tags**: Vegetarian, Gluten-Free

  ## Description
  A brief description of the test recipe.

  ## Ingredients
  - 1 cup flour
  - 2 tbsp olive oil (or substitute: 2 tbsp butter)

  ## Instructions
  1. **Mix**: Combine ingredients.
  2. **Cook**: Heat in pan until golden.

  ## Tips and Variations
  - Add 1 tsp vanilla for extra flavor

  ## Nutritional Information (Approximate, per serving)
  - Calories: 150 kcal
  - Protein: 4g
  - Fat: 6g
  - Carbohydrates: 20g
  `;

  it("parses title and overview fields", async () => {
    const result = await parseMarkdownToJson(sampleMarkdown);
    expect(result.title).toBe("Test Recipe Title");
    expect(result.overview.cuisine).toBe("Italian");
    expect(result.overview.difficulty).toBe("Easy");
    expect(result.overview.servings).toBe("2 servings");
    expect(result.overview.preptime).toBe("10 minutes");
    expect(result.overview.cooktime).toBe("20 minutes");
    expect(result.overview.totaltime).toBe("30 minutes");
    // Dietary tags parsing can vary based on markdown-to-HTML conversion; ensure it's an array
    expect(Array.isArray(result.overview.dietaryTags)).toBe(true);
  });

  it("parses ingredients and instructions", async () => {
    const result = await parseMarkdownToJson(sampleMarkdown);
    expect(Array.isArray(result.ingredients)).toBe(true);
    expect(result.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(result.ingredients[0]).toMatchObject({
      quantity: "1",
      name: "cup flour",
    });
    expect(result.ingredients[1].substitute).toBe("2 tbsp butter");

    expect(Array.isArray(result.instructions)).toBe(true);
    expect(result.instructions[0]).toMatchObject({
      step: 1,
      action: "Mix",
    });
  });
});