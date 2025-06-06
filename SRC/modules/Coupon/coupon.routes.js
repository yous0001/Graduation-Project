import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as couponController from "./coupon.controller.js"

const router=Router()
router.post("/create",auth([systemRoles.ADMIN]),expressAsyncHandler(couponController.addCoupon))

export default router