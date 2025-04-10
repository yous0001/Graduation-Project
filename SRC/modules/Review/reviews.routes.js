import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as ReviewController from "./reviews.controller.js";


const router=Router()

router.post("/add",auth(),expressAsyncHandler(ReviewController.addReview))
router.post("/reaction/:reviewId",auth(),expressAsyncHandler(ReviewController.addReaction))
router.delete("/delete/:reviewId",auth(),expressAsyncHandler(ReviewController.deleteReview))
router.put("/update/:reviewId",auth(),expressAsyncHandler(ReviewController.updateReview))

export default router 