import Cart from '../../../DB/models/cart.model.js';
import Order from '../../../DB/models/order.model.js';
import { createCheckoutSession } from '../../payment-handler/stripe.js';
import { orderStatuses, paymentMethods } from '../../utils/enums.utils.js';
import { calculateShippingFee, applyCouponDiscount } from './../Services/order.services.js';

export const createOrderByCart = async (req, res, next) => {
    const userId = req.user._id;
    const { shippingAddress, contactNumber, couponCode, paymentMethod } = req.body;
    let couponId = null;

    const vat=14
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
    const items = cart.ingredients.map(item => ({
        ingredientId: item.IngredientID._id,
        quantity: item.quantity,
        price: item.price
    }));
    const order = await Order.create({
        userId,
        shippingAddress,
        contactNumber,
        couponId,
        paymentMethod,
        shippingFee,
        vat,
        subTotal,
        total,
        items
    })
    await Cart.deleteOne({ userID: userId })
    return res.status(201).json({ message: "order created", order })
}

export const payWithStripe = async (req, res, next) => {
    const { orderId } = req.params;
    const user=req.user

    const order = await Order.findOne({ _id: orderId, userId:user._id }).populate('items.ingredientId')
    if (!order) return next(new Error("you don't have this order", { cause: 404 }))
    if (order.orderStatus != orderStatuses.pending) return next(new Error("order is not pending to be paid or have already been paid", { cause: 400 }))
    if (order.paymentMethod == paymentMethods.cash) return next(new Error("order is checked to be paid with cash", { cause: 400 }))

    const paymentObject = {
        customer_email: user.email,
        customer_data:{
            name: user.username,
            phone: order.contactNumber
        },
        metadata: { orderId: order._id.toString() },
        discounts: [],
        line_items: order.items.map(item => ({
            price_data: {
                currency: "EGP",
                product_data: {
                    name: item.ingredientId.name,
                    images: [item.ingredientId.image.secure_url],
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity
        }))
    }
    if(order.couponId){
        const stripeCoupon=await createStripeCoupon({couponId:order.couponId})
        if(!stripeCoupon) 
            return next(new Error("coupon not found", { cause: 404 }))

        paymentObject.discounts.push({
            coupon:stripeCoupon.id
        })
    }
    
    const checkOutSession = await createCheckoutSession(paymentObject);
    return res.status(200).json({ checkOutSession })
}

export const orderOverview = async (req, res, next) => {
    const userId = req.user._id;
    const {  couponCode } = req.body;
    let couponId = null;

    const vat=14
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
    const vatAmount=Math.ceil(subTotal*vat/100)
    let total = subTotal + shippingFee + vatAmount

    if (couponCode) {
        const { updatedTotal, couponId: appliedCouponId } = await applyCouponDiscount(
            couponCode,
            userId,
            total
        );
        total = updatedTotal;
        couponId = appliedCouponId;
    }

    return res.status(200).json({ couponId, shippingFee, vatAmount, subTotal, total })
}