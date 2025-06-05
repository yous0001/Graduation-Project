import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/system-roles.js";
import * as recommendationController from "./recommendation.controller.js"

const router=Router()

router.get("/",recommendationController.getRecommendations)

export default router