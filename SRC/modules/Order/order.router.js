import * as orderController from "./order.controller.js"


const router=Router()

router.post("/cart",auth(),orderController.createOrderByCart)

export default router