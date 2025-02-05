import { Router } from "express";
import * as categoryController from "./category.controller.js"
import { auth } from "../../middlewares/auth.js";
import { multerMiddleHost } from './../../middlewares/multer.js';
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { getDocumentByName } from "../../middlewares/finders.middleware.js";
import Category from "../../../DB/models/category.model.js";
import  expressAsyncHandler  from 'express-async-handler';
import { systemRoles } from "../../utils/system-roles.js";

const router =Router()
router.post('/create',auth(),getDocumentByName(Category), multerMiddleHost(allowedExtensions.image).single('image'),expressAsyncHandler(categoryController.createCategory))
router.get('/',expressAsyncHandler(categoryController.getAllCategories))
router.get('/get-category',expressAsyncHandler(categoryController.getCategory))
router.post('/add-mealdb',auth([systemRoles.ADMIN]),expressAsyncHandler(categoryController.addMealDB))

export default router