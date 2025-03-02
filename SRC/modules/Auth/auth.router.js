import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import * as authController from "./auth.controller.js"
import * as authSchemaes from "./auth.schema.js"
import { auth } from "../../middlewares/auth.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from './../../utils/allowed-extensions.js';

const router=Router()

router.post("/register", validationMiddleware(authSchemaes.registerSchema),expressAsyncHandler(authController.register))
router.get("/verify-email", validationMiddleware(authSchemaes.verifyEmailSchema),expressAsyncHandler(authController.verifyEmail))
router.post("/login",validationMiddleware(authSchemaes.loginSchema), expressAsyncHandler(authController.login))
router.get("/refresh-token", expressAsyncHandler(authController.refreshToken))
router.get("/resend-otp",expressAsyncHandler(authController.resendOtp))
router.get("/verify-login",validationMiddleware(authSchemaes.verifyLoginSchema),expressAsyncHandler(authController.verifyLoginCode))
router.get("/get-profile",auth(),expressAsyncHandler(authController.getProfile))
router.delete("/delete-user",auth(),expressAsyncHandler(authController.deleteUser))
router.delete("/delete-profileImg",auth(),expressAsyncHandler(authController.deleteProfileImg))
router.post("/upload-profileImg",auth(),multerMiddleHost({extensions:allowedExtensions.image}).single("profileImg"),expressAsyncHandler(authController.uploadProfileImg))
router.put("/change-password",auth(),validationMiddleware(authSchemaes.changePasswordSchema),expressAsyncHandler(authController.changePassword))
router.put("/update-user",auth(),validationMiddleware(authSchemaes.updateUserSchema),expressAsyncHandler(authController.updateUser))


router.get("/forget-password", validationMiddleware(authSchemaes.forgetPasswordSchema),expressAsyncHandler(authController.forgetPassword))
router.get("/reset-password/:token",validationMiddleware(authSchemaes.resetPasswordSchema), expressAsyncHandler(authController.resetPassword))

router.post("/toogle-favourite/:recipeID",auth(),validationMiddleware(authSchemaes.toggleFavouriteSchema),expressAsyncHandler(authController.toogleFavourite))
export default router