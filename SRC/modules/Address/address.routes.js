import { Router } from "express";
import * as addressController from "./address.controller.js"
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";


const router=Router()

router.post("/add",auth(),expressAsyncHandler(addressController.addAddress))

export default router