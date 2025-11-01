import Stripe from "stripe"
import Coupon from "../../DB/models/coupon.model.js";
import { discountTypes } from "../utils/enums.utils.js";
import paymentConfig from "../modules/Order/options/payment.config.js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export const createCheckoutSession=async({
    customer_email,
    metadata,
    discounts,
    line_items,
    customer_data
    })=>{
    if (!stripe) {
        throw new Error("Stripe not configured: missing STRIPE_SECRET_KEY");
    }
    
    const customer = await stripe.customers.create({
        email: customer_email,
        ...customer_data
        });
    

    const paymentData=await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: customer.id,
        metadata,
        success_url: paymentConfig.stripe.successUrl,
        cancel_url: paymentConfig.stripe.cancelUrl,
        discounts,
        line_items
    })
    
    return paymentData
}


export const createStripeCoupon=async({couponId})=>{
    if (!stripe) {
        throw new Error("Stripe not configured: missing STRIPE_SECRET_KEY");
    }
    const coupon =await Coupon.findById(couponId);
    if(!coupon){
        return {success:false,message:"coupon not found"}
    }
    let couponObject={
    }
    if(coupon.discountType===discountTypes.percentage){
        couponObject={name:coupon.code,percent_off:coupon.discountValue}
    }else if(coupon.discountType===discountTypes.fixed){
        couponObject={name:coupon.code,amount_off:coupon.discountValue*paymentConfig.stripe.multiplier,currency:paymentConfig.stripe.currency}
    }
    const stripeCoupon=await stripe.coupons.create(couponObject)
    return stripeCoupon
}