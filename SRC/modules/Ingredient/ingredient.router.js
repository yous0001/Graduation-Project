import { Router } from "express";
import { validationMiddleware } from './../../middlewares/validation.middleware.js';
import * as ingredientController from "./ingredient.controller.js"
import * as ingredeintSchema from "./ingredient.schema.js"
import { auth } from './../../middlewares/auth.js';
import { systemRoles } from "../../utils/system-roles.js";
import { multerMiddleHost } from "../../middlewares/multer.js";
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import expressAsyncHandler from "express-async-handler";

const router = Router()

router.post('/add',
        auth([systemRoles.ADMIN]),multerMiddleHost({extensions:allowedExtensions.image}).single("image"),
        validationMiddleware(ingredeintSchema.addIngredientSchema),
        expressAsyncHandler(ingredientController.addIngredient))
router.delete('/delete/:id',
        auth([systemRoles.ADMIN]),
        expressAsyncHandler(ingredientController.deleteIngredient))
router.put('/update/:id',
        auth([systemRoles.ADMIN]),
        validationMiddleware(ingredeintSchema.updateIngredientSchema),
        expressAsyncHandler(ingredientController.updateIngredient))
router.post('/add-mealDB',
        auth([systemRoles.ADMIN]),
        expressAsyncHandler(ingredientController.addMealDBIngredients))
router.get('/list',
        expressAsyncHandler(ingredientController.getIngredients))
export default router