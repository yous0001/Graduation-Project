import { Router } from "express";
import * as categoryController from "./category.controller.js"
import { auth } from "../../middlewares/auth.js";
import { multerMiddleHost } from './../../middlewares/multer.js';
import { allowedExtensions } from "../../utils/allowed-extensions.js";
import { getDocumentByName } from "../../middlewares/finders.middleware.js";
import Category from "../../../DB/models/category.model.js";

const router =Router()
router.post('/create',auth(),getDocumentByName(Category), multerMiddleHost(allowedExtensions.image).single('image'),categoryController.createCategory)

export default router