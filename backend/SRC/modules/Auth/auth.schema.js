import Joi from "joi";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = {
    body: Joi.object({
        name: Joi.string().min(3).max(50).required().messages({
            "string.base": "Name must be a string.",
            "string.min": "Name must be at least 3 characters long.",
            "string.max": "Name must not exceed 50 characters.",
            "any.required": "Name is required.",
        }),
        email: Joi.string().email().required().messages({
            "string.email": "Please provide a valid email address.",
            "any.required": "Email is required.",
        }),
        password: Joi.string().min(8).regex(passwordRegex).required().messages({
            "string.pattern.base":
                "Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            "string.min": "Password must be at least 8 characters long.",
            "any.required": "Password is required.",
        }),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
            "any.only": "Confirm password must match the password.",
            "any.required": "Confirm password is required.",
        }),
        phoneNumbers: Joi.array()
        .items(Joi.string().length(11).pattern(/^\d+$/).messages({
            "string.base": "Phone number must be a string.",
            "string.length": "Phone number must be exactly 11 digits.",
            "string.pattern.base": "Phone number must contain only digits.",
        }))
        .required()
        .messages({
            "array.base": "Phone numbers must be an array.",
            "any.required": "Phone numbers are required.",
        }),
    }),
};

export const loginSchema = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            "string.email": "Please provide a valid email address.",
            "any.required": "Email is required.",
        }),
        password: Joi.string().min(8).required().messages({
            "string.min": "Password must be at least 8 characters long.",
            "any.required": "Password is required.",
        }),
    }),
  };
  
  export const verifyEmailSchema = {
    query: Joi.object({
        token: Joi.string().required().messages({
            "any.required": "Verification token is required.",
        }),
    }),
  };
  
  export const verifyLoginSchema = {
    body: Joi.object({
        code: Joi.string().min(6).max(6).required().messages({
            "string.min": "Verification code must be exactly 6 characters.",
            "string.max": "Verification code must be exactly 6 characters.",
            "any.required": "Verification code is required.",
        }),
    }),
  };
  
  export const forgetPasswordSchema = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            "string.email": "Please provide a valid email address.",
            "any.required": "Email is required.",
        }),
    }),
  };
  
  export const resetPasswordSchema = {
    body: Joi.object({
        password: Joi.string().min(8).regex(passwordRegex).required().messages({
            "string.pattern.base":
            "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            "string.min": "Password must be at least 8 characters long.",
            "any.required": "Password is required.",
        }),
    }),
    params: Joi.object({
        token: Joi.string().required().messages({
            "any.required": "Reset token is required.",
        }),
    }),
  };

  export const changePasswordSchema={
    body: Joi.object({
        oldPassword: Joi.string().required().messages({
            "any.required": "Old password is required.",
        }),
        newPassword: Joi.string().min(8).regex(passwordRegex).required().messages({
            "string.pattern.base":
            "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            "string.min": "Password must be at least 8 characters long.",
            "any.required": "Password is required.",
        }),
    }),
  }

  export const updateUserSchema={
    body: Joi.object({
        name: Joi.string().min(3).max(50).optional().messages({
            "string.base": "Name must be a string.",
            "string.min": "Name must be at least 3 characters long.",
            "string.max": "Name must not exceed 50 characters."
        }),
        phoneNumbers: Joi.array()
        .items(Joi.string().length(11).pattern(/^01[0-25]\d{8}$/).messages({
            "string.base": "Phone number must be a string.",
            "string.length": "Phone number must be exactly 11 digits.",
            "string.pattern.base": "Phone number must be a valid Egyptian phone number.",
        }))
        .optional()
        .messages({
            "array.base": "Phone numbers must be an array."
        }),
        addresses: Joi.array()
        .items(Joi.string().min(3).max(50).messages({
            "string.base": "Address must be a string.",
            "string.min": "Address must be at least 3 characters long.",
            "string.max": "Address must not exceed 50 characters."
        }))
        .optional()
        .messages({
            "array.base": "Addresses must be an array."
        }),
        age: Joi.number().optional().messages({
            "number.base": "Age must be a number."
        })
    }),
  }