import { Router } from "express";
import { auth } from "../../middlewares/auth.js";
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import * as receipeController from "./recipe.controller.js"
import expressAsyncHandler from "express-async-handler";
import * as recipeSchema from './reciepe.schema.js';
import { validationMiddleware } from './../../middlewares/validation.middleware.js';
import {parseFieldsMiddleware} from "../../middlewares/parseFields.middleware.js";

const router=Router()

router.post("/add",auth([systemRoles.ADMIN]),
    multerMiddleHost({extensions:allowedExtensions.image}).array("images",5),
    parseFieldsMiddleware(["ingredients","tags"]),
    validationMiddleware(recipeSchema.addRecipeSchema),
    expressAsyncHandler(receipeController.addRecipe))

router.post("/add-mealDB",auth([systemRoles.ADMIN]),
    expressAsyncHandler(receipeController.addMealDBRecipes))


export default router;
