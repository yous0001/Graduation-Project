import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import * as authController from "./auth.controller.js"
import { auth } from "../../middlewares/auth.js";

const router=Router()

router.post("/register", expressAsyncHandler(authController.register))
router.get("/verify-email", expressAsyncHandler(authController.verifyEmail))
router.post("/login", expressAsyncHandler(authController.login))
router.get("/refresh-token", auth(),expressAsyncHandler(authController.refreshToken))
router.get("/verify-login",expressAsyncHandler(authController.verifyLoginCode))

router.get("/forget-password", expressAsyncHandler(authController.forgetPassword))
router.get("/reset-password/:token", expressAsyncHandler(authController.resetPassword))

export default router