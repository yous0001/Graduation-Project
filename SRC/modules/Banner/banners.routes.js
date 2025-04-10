import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as bannerController from "./banners.controller.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { systemRoles } from "../../utils/system-roles.js";



const router=Router()

router.post("/add",auth([systemRoles.ADMIN]),multerMiddleHost(allowedExtensions.image).array('images',5),expressAsyncHandler(bannerController.addBanner))

router.put("/update/:id",auth([systemRoles.ADMIN]),multerMiddleHost(allowedExtensions.image).array('images',5),expressAsyncHandler(bannerController.updateBanner))

router.delete("/delete/:id",auth([systemRoles.ADMIN]),expressAsyncHandler(bannerController.deleteBanner))
router.get("/:section",expressAsyncHandler(bannerController.getBanners))

export default router 