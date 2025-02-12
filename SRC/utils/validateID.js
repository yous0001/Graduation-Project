import Joi from "joi";
import { Types } from "mongoose";


const objectIdValidation = (value, helper) => {
    if (!Types.ObjectId.isValid(value)) {
        return helper.message("Invalid ObjectId");
    }
    return value; 
};


export const validateId = (fieldName = "id") => {
    return Joi.string()
        .custom(objectIdValidation, "ObjectId validation")
        .required()
        .messages({
            "string.base": `${fieldName} must be a string.`,
            "any.required": `${fieldName} is required.`,
            "any.custom": `${fieldName} must be a valid ObjectId.`,
        });
};
