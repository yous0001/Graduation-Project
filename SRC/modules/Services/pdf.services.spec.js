import { describe, it, expect } from "bun:test";
import { generateDietPlanPdf } from "./pdf.services.js";

describe("generateDietPlanPdf validations", () => {
  it("throws for missing dietPlan or totalCalories", async () => {
    await expect(generateDietPlanPdf({})).rejects.toThrow("Failed to generate diet plan PDF");
    await expect(generateDietPlanPdf({ dietPlan: [] })).rejects.toThrow("Failed to generate diet plan PDF");
    await expect(generateDietPlanPdf({ totalCalories: 2000 })).rejects.toThrow("Failed to generate diet plan PDF");
  });
});