import Address from '../../../DB/models/address.model.js';
import Cart from '../../../DB/models/cart.model.js';
import Order from '../../../DB/models/order.model.js';
import { createCheckoutSession, createStripeCoupon } from '../../payment-handler/stripe.js';
import { orderStatuses, paymentMethods } from '../../utils/enums.utils.js';
import { calculateShippingFee, applyCouponDiscount, checkCouponDiscount } from './../Services/order.services.js';

export const createOrderByCart = async (req, res, next) => {
    const userId = req.user._id;
    const { shippingAddressID, contactNumber, couponCode, paymentMethod } = req.body;
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

    const isAddrecessExist = await Address.findById(shippingAddressID);
    if (!isAddrecessExist) {
        return res.status(400).json({ message: "shipping address not found" });
    }
    if(isAddrecessExist.userId.toString()!==userId.toString() ) 
        return res.status(400).json({message:"this is not one of your addresses."});

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
    const items = cart.ingredients.map(item => ({
        ingredientId: item.IngredientID._id,
        quantity: item.quantity,
        price: item.price
    }));
    const order = await Order.create({
        userId,
        shippingAddressID,
        contactNumber,
        couponId,
        paymentMethod,
        shippingFee,
        vat:vatAmount,
        subTotal,
        total,
        items,
        fromCart: true
    })
    await Cart.deleteOne({ userID: userId })
    return res.status(201).json({ message: "order created", order })
}

export const payWithStripe = async (req, res, next) => {
    const { orderId } = req.params;
    const user=req.user

    const order = await Order.findOne({ _id: orderId, userId:user._id }).populate('items.ingredientId')
    if (!order) return next(new Error("you don't have this order", { cause: 404 }))
    if(order.paymentMethod==orderStatuses.cancelled) return next(new Error("order have been canceled", { cause: 400 }))
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
    paymentObject.line_items.push({
        price_data: {
            currency: "EGP",
            product_data: {
                name: "shipping fee",
            },
            unit_amount: order.shippingFee * 100,
        },
        quantity: 1
    })
    paymentObject.line_items.push({
        price_data: {
            currency: "EGP",
            product_data: {
                name: "vat",
            },
            unit_amount: order.vat * 100,
        },
        quantity: 1
    })
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
    const user = req.user;
    const userId = req.user._id;
    const {  couponCode } = req.body;
    let couponId = null;
    let coupondiscount=0
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
        const { updatedTotal, couponId: appliedCouponId,discount } = await checkCouponDiscount(
            couponCode,
            userId,
            total
        );
        total = updatedTotal;
        couponId = appliedCouponId;
        coupondiscount=discount
    }

    return res.status(200).json({ couponId, shippingFee, vatAmount,coupondiscount, subTotal, total , addresses: user.addresses })
}

export const checkCouponCode = async (req,res,next) => {
    const {  couponCode, total } = req.body;
    const userId = req.user._id;
    const { updatedTotal, couponId: appliedCouponId,discount } = await checkCouponDiscount(
            couponCode,
            userId,
            total
        );

    return res.status(200).json({ totalAfterDiscount: updatedTotal, couponId: appliedCouponId,discount })
}

export const cancelOrder=async(req,res,next)=>{
    const {orderId}=req.params
    const order=await Order.findOneAndUpdate({_id:orderId},{orderStatus:orderStatuses.canceled},{new:true})
    return res.status(200).json({message:"order canceled",order})
}