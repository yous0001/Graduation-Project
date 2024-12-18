import Joi from "joi";
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const registerSchema={
    body:Joi.object({
            name: Joi.string().min(3).max(50).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).regex(passwordRegex).required(),
            confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
            phoneNumbers: Joi.array().items(Joi.string().length(11)).required()
        })
}
export const loginSchema={
    body:Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        })
}
export const verifyEmailSchema={
    query:Joi.object({
            token: Joi.string().required()
        })
}
export const verifyLoginSchema={
    body:Joi.object({
            code: Joi.string().min(6).max(6).required(),
        })
}
export const forgetPasswordSchema={
    body:Joi.object({
            email: Joi.string().email().required()
        })
}
export const resetPasswordSchema={
    body:Joi.object({
            password: Joi.string().min(8).regex(passwordRegex).required(),
        }),
    params:Joi.object({
        token: Joi.string().required()
    })
}