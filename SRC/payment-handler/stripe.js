import Stripe from "stripe"
import Coupon from "../../DB/models/coupon.model.js";

const stripe=new Stripe(process.env.STRIPE_SECRET_KEY)

export const createCheckoutSession=async({
    customer_email,
    metadata,
    discounts,
    line_items,
    customer_data
    })=>{
    
    const customer = await stripe.customers.create({
        email: customer_email,
        ...customer_data
        });

    const paymentData=await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: customer.id,
        metadata,
        success_url: process.env.SUCCESS_URL,
        cancel_url: process.env.CANCEL_URL,
        discounts,
        line_items
    })
    
    return paymentData
}


export const createStripeCoupon=async({couponId})=>{
    const coupon =await Coupon.findById(couponId);
    if(!coupon){
        return {success:false,message:"coupon not found"}
    }
    let couponObject={
        name:coupon.code
    }
    if(coupon.discountType===discountTypes.PERCENTAGE){
        couponObject={percent_off:coupon.discountValue}
    }else if(coupon.discountType===discountTypes.AMOUNT){
        couponObject={amount_off:coupon.discountValue,currency:"EGP"}
    }
    const stripeCoupon=await stripe.coupons.create(couponObject)
    return stripeCoupon
}