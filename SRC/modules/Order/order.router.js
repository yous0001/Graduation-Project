import { Router } from "express"
import * as orderController from "./order.controller.js"
import { auth } from "../../middlewares/auth.js"
import expressAsyncHandler from 'express-async-handler';


const router=Router()

router.post("/cart",auth(),expressAsyncHandler(orderController.createOrderByCart))
router.post("/stripe/:orderId",auth(),expressAsyncHandler(orderController.payWithStripe))

export default router