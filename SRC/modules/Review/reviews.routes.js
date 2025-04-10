import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as ReviewController from "./reviews.controller.js";


const router=Router()

router.post("/add",auth(),expressAsyncHandler(ReviewController.addReview))
router.post("/reaction/:reviewId",auth(),expressAsyncHandler(ReviewController.addReaction))

export default router 