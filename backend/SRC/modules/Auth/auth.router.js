import { Router } from "express";
import expressAsyncHandler from "express-async-handler";
import * as authController from "./auth.controller.js"

const router=Router()

router.post("/register", expressAsyncHandler(authController.register))
router.post("/login", expressAsyncHandler(authController.login))

export default router