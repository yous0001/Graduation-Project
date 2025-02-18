import Joi from "joi";
import { validateId } from './../../utils/validateID.js';


export const addRecipeSchema = {
    body: Joi.object({
        name: Joi.string().required().min(2).max(100).trim().messages({
            "string.base": "Name must be a string.",
            "string.empty": "Name is required.",
            "string.min": "Name must be at least 2 characters long.",
            "string.max": "Name cannot exceed 100 characters.",
            "any.required": "Name is required.",
        }),
        description: Joi.string().optional().allow("").max(10000).messages({
            "string.base": "Description must be a string.",
            "string.max": "Description cannot exceed 10000 characters.",
        }),
        ingredients: Joi.array()
            .items(
                Joi.object({
                    ingredient: validateId("Ingredient ID"), 
                    amount: Joi.string()
                        .required()
                        .min(1)
                        .trim()
                        .messages({
                            "string.base": "Amount must be a string.",
                            "string.empty": "Amount cannot be empty.",
                            "string.min": "Amount must be at least 1 character long.",
                            "any.required": "Amount is required.",
                        }),
                })
            )
            .required()
            .min(1)
            .messages({
                "array.base": "Ingredients must be an array of objects.",
                "array.min": "At least one ingredient object is required.",
                "any.required": "Ingredients are required.",
            }),
        directions: Joi.string().required().min(5).max(50000).trim().messages({
            "string.base": "Directions must be a string.",
            "string.empty": "Directions are required.",
            "string.min": "Directions must be at least 5 characters long.",
            "string.max": "Directions cannot exceed 50000 characters.",
            "any.required": "Directions are required.",
        }),
        videoLink: Joi.string()
            .uri()
            .optional()
            .messages({
                "string.base": "Video link must be a string.",
                "string.uri": "Video link must be a valid URL.",
            }),
        tags: Joi.array()
            .items(Joi.string().min(2).max(30).trim().messages({
                "string.base": "Each tag must be a string.",
                "string.empty": "Tag cannot be empty.",
                "string.min": "Tag must be at least 2 characters long.",
                "string.max": "Tag cannot exceed 30 characters.",
            }))
            .optional()
            .messages({
                "array.base": "Tags must be an array of strings.",
            }),
    }),
    query: Joi.object({
        category: validateId("categoryID"),
        country: validateId("countryID"),
    }),
};

export const updateRecipeSchema = {
    params: Joi.object({
        recipeID: validateId("Recipe ID"), 
    }),
    body: Joi.object({
        name: Joi.string().optional().min(2).max(100).trim().messages({
            "string.base": "Name must be a string.",
            "string.min": "Name must be at least 2 characters long.",
            "string.max": "Name cannot exceed 100 characters.",
        }),
        description: Joi.string().optional().allow("").max(10000).messages({
            "string.base": "Description must be a string.",
            "string.max": "Description cannot exceed 10000 characters.",
        }),
        directions: Joi.string().optional().min(5).max(50000).trim().messages({
            "string.base": "Directions must be a string.",
            "string.min": "Directions must be at least 5 characters long.",
            "string.max": "Directions cannot exceed 50000 characters.",
        }),
        videoLink: Joi.string()
            .uri()
            .optional()
            .messages({
            "string.base": "Video link must be a string.",
            "string.uri": "Video link must be a valid URL.",
            }),
        tags: Joi.array()
            .items(
            Joi.string()
                .min(2)
                .max(30)
                .trim()
                .messages({
                "string.base": "Each tag must be a string.",
                "string.min": "Tag must be at least 2 characters long.",
                "string.max": "Tag cannot exceed 30 characters.",
                })
            )
            .optional()
            .messages({
            "array.base": "Tags must be an array of strings.",
            }),
    }),
  };
  