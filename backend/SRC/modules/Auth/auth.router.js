import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import * as authController from "./auth.controller.js"
import * as authSchemaes from "./auth.schema.js"
import { auth } from "../../middlewares/auth.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";

const router=Router()

router.post("/register", validationMiddleware(authSchemaes.registerSchema),expressAsyncHandler(authController.register))
router.get("/verify-email", expressAsyncHandler(authController.verifyEmail))
router.post("/login", expressAsyncHandler(authController.login))
router.get("/refresh-token", auth(),expressAsyncHandler(authController.refreshToken))
router.get("/verify-login",expressAsyncHandler(authController.verifyLoginCode))

router.get("/forget-password", expressAsyncHandler(authController.forgetPassword))
router.get("/reset-password/:token", expressAsyncHandler(authController.resetPassword))

export default router