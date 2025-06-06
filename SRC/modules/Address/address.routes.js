import { Router } from "express";
import * as addressController from "./address.controller.js"
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";


const router=Router()

router.post("/add",auth(),expressAsyncHandler(addressController.addAddress))
router.get("/",auth(),expressAsyncHandler(addressController.getAddresses))
router.put("/:addressId",auth(),expressAsyncHandler(addressController.updateAddress))
router.delete("/:addressId",auth(),expressAsyncHandler(addressController.deleteAddress))
router.get("/get-default",auth(),expressAsyncHandler(addressController.getDefaultAddress))
router.patch("/set-default/:addressId",auth(),expressAsyncHandler(addressController.setAsDefaultAddress))

export default router