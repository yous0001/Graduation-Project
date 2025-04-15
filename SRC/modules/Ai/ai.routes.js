import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import expressAsyncHandler from "express-async-handler";
import * as aiController from "./ai.controller.js";


const router=Router()
router.post("/chat",aiController.getRecommendation)


export default router 