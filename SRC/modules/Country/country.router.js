import { Router } from "express";
import { systemRoles } from "../../utils/system-roles.js";
import Country from "../../../DB/models/country.model.js";
import { auth } from "../../middlewares/auth.js";
import { getDocumentByName } from "../../middlewares/finders.middleware.js";
import * as countryController from "./country.controller.js"
import expressAsyncHandler from "express-async-handler";

const router =Router()
router.post('/create',auth([systemRoles.ADMIN]),getDocumentByName(Country), expressAsyncHandler(countryController.addCountry))
router.get('/',expressAsyncHandler(countryController.getAllCountries))
router.post('/add-mealdb',auth([systemRoles.ADMIN]),expressAsyncHandler(countryController.addMealDBCountries))
router.put('/update/:id',auth([systemRoles.ADMIN]), expressAsyncHandler(countryController.updateCountry))
export default router