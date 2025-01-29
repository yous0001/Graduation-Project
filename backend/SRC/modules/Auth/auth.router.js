import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import * as authController from "./auth.controller.js"
import * as authSchemaes from "./auth.schema.js"
import { auth } from "../../middlewares/auth.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router=Router()

router.post("/register", validationMiddleware(authSchemaes.registerSchema),expressAsyncHandler(authController.register))
router.get("/verify-email", validationMiddleware(authSchemaes.verifyEmailSchema),expressAsyncHandler(authController.verifyEmail))
router.post("/login",validationMiddleware(authSchemaes.loginSchema), expressAsyncHandler(authController.login))
router.get("/refresh-token", auth(),expressAsyncHandler(authController.refreshToken))
router.get("/resend-otp",expressAsyncHandler(authController.resendOtp))
router.get("/verify-login",validationMiddleware(authSchemaes.verifyLoginSchema),expressAsyncHandler(authController.verifyLoginCode))
router.get("/get-profile",auth(),expressAsyncHandler(authController.getProfile))

router.get("/forget-password", validationMiddleware(authSchemaes.forgetPasswordSchema),expressAsyncHandler(authController.forgetPassword))
router.get("/reset-password/:token",validationMiddleware(authSchemaes.resetPasswordSchema), expressAsyncHandler(authController.resetPassword))

export default router