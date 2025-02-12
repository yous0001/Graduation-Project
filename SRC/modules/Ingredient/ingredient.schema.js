import Joi from "joi";

export const addIngredientSchema = {
    body: Joi.object({
            name: Joi.string().required().min(2).max(50).trim().messages({
            "string.base": "Name must be a string.",
            "string.empty": "Name is required.",
            "string.min": "Name must be at least 2 characters long.",
            "string.max": "Name cannot exceed 50 characters.",
            "any.required": "Name is required.",
            }),
            description: Joi.string().optional().allow("").max(500).messages({
            "string.base": "Description must be a string.",
            "string.max": "Description cannot exceed 500 characters.",
            }),
            basePrice: Joi.number().required().positive().messages({
            "number.base": "Base price must be a number.",
            "number.positive": "Base price must be a positive number.",
            "any.required": "Base price is required.",
            }),
            discountAmount: Joi.number().optional().min(0).messages({
            "number.base": "Discount amount must be a number.",
            "number.min": "Discount amount cannot be less than 0.",
            }),
            discountType: Joi.string()
            .valid("percentage", "fixed")
            .when("discountAmount", {
                is: Joi.exist(),
                then: Joi.required(),
                otherwise: Joi.optional(),
            })
            .messages({
                "string.base": "Discount type must be a string.",
                "any.only": "Discount type must be either 'percentage' or 'fixed'.",
                "any.required":
                "Discount type is required when discount amount is provided.",
            }),
            stock: Joi.number().required().integer().min(0).messages({
            "number.base": "Stock must be a number.",
            "number.integer": "Stock must be an integer.",
            "number.min": "Stock cannot be less than 0.",
            "any.required": "Stock is required.",
            }),
    }),
};
