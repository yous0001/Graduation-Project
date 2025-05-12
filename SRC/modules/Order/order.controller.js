import Cart from '../../../DB/models/cart.model.js';
import Order from '../../../DB/models/order.model.js';
import { calculateShippingFee, applyCouponDiscount } from './../Services/order.services.js';

export const createOrderByCart = async (req, res, next) => {
    const userId = req.user._id;
    const { shippingAddress, contactNumber, couponCode, paymentMethod, vat = 14 } = req.body;
    let couponId = null;

    const cart = await Cart.findOne({ userID: userId }).populate('ingredients.IngredientID')
    if (!cart || cart.ingredients.length == 0) {
        return res.status(400).json({ message: "cart is empty" });
    }

    const isNotAvaliable = cart.ingredients.find(ing => ing.IngredientID.stock < ing.quantity)
    if (isNotAvaliable) {
        return res.status(400).json({ message: `ingredient ${isNotAvaliable.IngredientID.name} is not available` });
    }
    const subTotal = cart.subTotal;
    const shippingFee = calculateShippingFee(cart.ingredients.length);
    let total = subTotal + shippingFee + (subTotal * vat / 100)
    
    if (couponCode) {
        const { updatedTotal, couponId: appliedCouponId } = await applyCouponDiscount(
            couponCode,
            userId,
            total
        );
        total = updatedTotal;
        couponId = appliedCouponId;
    }

    const order = await Order.create({
        userID: userId,
        shippingAddress,
        contactNumber,
        couponId,
        paymentMethod,
        shippingFee,
        vat,
        subTotal,
        total,
        ingredients: cart.ingredients
    })
    await Cart.deleteOne({ userID: userId })
    return res.status(201).json({ message: "order created", order })
}