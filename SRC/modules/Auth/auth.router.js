import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import * as authController from "./auth.controller.js"
import * as authSchemas from "./auth.schema.js"
import { auth } from "../../middlewares/auth.js";
import { validationMiddleware } from "../../middlewares/validation.middleware.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from './../../utils/allowed-extensions.js';

const router=Router()

router.post("/register", validationMiddleware(authSchemas.registerSchema),expressAsyncHandler(authController.register))
router.get("/verify-email", validationMiddleware(authSchemas.verifyEmailSchema),expressAsyncHandler(authController.verifyEmail))
router.post("/login",validationMiddleware(authSchemas.loginSchema), expressAsyncHandler(authController.login))
router.get("/refresh-token", expressAsyncHandler(authController.refreshToken))
router.post("/resend-otp",expressAsyncHandler(authController.resendOtp))
router.post("/verify-login",validationMiddleware(authSchemas.verifyLoginSchema),expressAsyncHandler(authController.verifyLoginCode))
router.get("/get-profile",auth(),expressAsyncHandler(authController.getProfile))
router.delete("/delete-user",auth(),expressAsyncHandler(authController.deleteUser))
router.delete("/delete-profileImg",auth(),expressAsyncHandler(authController.deleteProfileImg))
router.post("/upload-profileImg",auth(),multerMiddleHost({extensions:allowedExtensions.image}).single("profileImg"),expressAsyncHandler(authController.uploadProfileImg))
router.put("/change-password",auth(),validationMiddleware(authSchemas.changePasswordSchema),expressAsyncHandler(authController.changePassword))
router.put("/update-user",auth(),validationMiddleware(authSchemas.updateUserSchema),expressAsyncHandler(authController.updateUser))


router.post("/forget-password", validationMiddleware(authSchemas.forgetPasswordSchema),expressAsyncHandler(authController.forgetPassword))
router.post("/reset-password/:token",validationMiddleware(authSchemas.resetPasswordSchema), expressAsyncHandler(authController.resetPassword))

router.post("/toogle-favourite/:recipeID",auth(),validationMiddleware(authSchemas.toggleFavouriteSchema),expressAsyncHandler(authController.toogleFavourite))
router.get("/get-favourite",auth(),expressAsyncHandler(authController.getFavouriteRecipes))

export default router