import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as cartController from "./cart.controller.js";


const router=Router()

router.post("/add",auth(),expressAsyncHandler(cartController.addToCart))

export default router 