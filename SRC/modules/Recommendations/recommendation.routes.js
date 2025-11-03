import { Router } from "express";
import * as recommendationController from "./recommendation.controller.js";
import expressAsyncHandler from "express-async-handler";

const router = Router();

router.get("/", recommendationController.getRecommendations);
router.get(
  "/:name",
  expressAsyncHandler(recommendationController.getSpecificRecommendation)
);
export default router;
