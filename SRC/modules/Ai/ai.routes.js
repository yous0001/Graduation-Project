import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as aiController from "./ai.controller.js";


const router=Router()
router.post("/chat/ingredients",aiController.getRecommendation)
router.post("/chat/legacy",aiController.getLegacyRecommendation)
router.post("/chat/mood",aiController.getRecipeByMood)
router.post("/diet-plan",auth(),aiController.getDietPlan)
router.post("/serach-ai",aiController.searchWithAi)

export default router 