import { discountTypes } from '../../utils/enums.utils.js';
import Coupon from './../../../DB/models/coupon.model.js';
import orderConfig from './options/order.config.js';


export const calculateShippingFee = (itemCount) => {
    // Check if itemCount is valid
    if (itemCount <= 0) return 0;

    const baseFee = orderConfig.shipping.baseFee; // Fee for the first item
    const additionalItemFee = orderConfig.shipping.additionalItemFee; // Fee per additional item
    const discountPerItem = orderConfig.shipping.discountPerItem; // Discount per item for large orders
    const maxDiscount = orderConfig.shipping.maxDiscount; // Maximum discount 

    // Base fee for the first item
    let shippingFee = baseFee;

    // Additional items
    if (itemCount > 1) {
        const additionalItems = itemCount - 1;
        let additionalFee = additionalItemFee * additionalItems;

        // Apply discount based on number of items so that discount is increased with the number of items but it can not be more than 30% of the additional fee
        const discount = Math.min(discountPerItem * additionalItems, maxDiscount * additionalFee);
        additionalFee -= discount;

        shippingFee += additionalFee;
    }

    // Round to nearest decimal
    return Math.round(shippingFee);
};



export const applyCouponDiscount = async (couponCode, userId, total) => {
    try {
        const {updatedTotal,couponId} = await checkCouponDiscount(couponCode, userId, total);

        await Coupon.findByIdAndUpdate(couponId,
            { $push: { usedBy: userId } },
            { new: true });
        return {
            updatedTotal,
            couponId
        };
    } catch (error) {
        // Ensure error has statusCode
        error.statusCode = error.statusCode || orderConfig.errorCodes.serverError;
        throw error;
    }
};

export const checkCouponDiscount = async(couponCode, userId, total)=>{
    try {
        if (!userId) {
            const error = new Error("User ID is required");
            error.statusCode = orderConfig.errorCodes.invalidRequest;
            throw error;
        }
        if (typeof total !== "number" || total < 0) {
            const error = new Error("Invalid order total");
            error.statusCode = orderConfig.errorCodes.invalidRequest;
            throw error;
        }

        // Find and update coupon atomically to prevent race conditions
        const coupon = await Coupon.findOne(
            {
                code: couponCode,
                status: "active",
                expiresAt: { $gt: Date.now() },//expiresAt is greater than current date (coupon is not expired)
                usedBy: { $nin: [userId] },//userId is not in usedBy array (he doesn't use it before)
            }
        );

        // Check if coupon exists and is valid to avoid making error very general
        if (!coupon) {
            const existingCoupon = await Coupon.findOne({ code: couponCode });
            if (!existingCoupon) {
                const error = new Error("Coupon not found");
                error.statusCode = orderConfig.errorCodes.notFound;
                throw error;
            }
            if (existingCoupon.expiresAt < Date.now()) {
                const error = new Error("Coupon is expired");
                error.statusCode = orderConfig.errorCodes.invalidRequest;
                throw error;
            }
            if (existingCoupon.usedBy.includes(userId)) {
                const error = new Error("Coupon is used by you before");
                error.statusCode = orderConfig.errorCodes.invalidRequest;
                throw error;
            }
            // If we reach here, maxUsage must be the issue
            if (existingCoupon.usedBy.length >= existingCoupon.maxUsage) {
                const error = new Error("Coupon is used by max users");
                error.statusCode = orderConfig.errorCodes.invalidRequest;
                throw error;
            }
            if(existingCoupon.status !== "active"){
                const error = new Error("Coupon is not active");
                error.statusCode = orderConfig.errorCodes.invalidRequest;
                throw error;
            }
            // Fallback for unexpected cases
            const error = new Error("Coupon is invalid");
            error.statusCode = orderConfig.errorCodes.invalidRequest;
            throw error;
        }

        // Apply discount
        let updatedTotal = total;
        let discount=0;
        if (coupon.discountType === discountTypes.percentage) {
            discount = Math.floor(Math.min((total * coupon.discountValue) / 100, coupon.maxDiscountAmount));
            updatedTotal -= discount;
        } else if (coupon.discountType === discountTypes.fixed) {
            discount = Math.floor(Math.min(coupon.discountValue, coupon.maxDiscountAmount));
            updatedTotal -= discount;
            updatedTotal = Math.max(updatedTotal, 0);
        } else {
            const error = new Error("Invalid discount type");
            error.statusCode = 400;
            throw error;
        }

        return {
            updatedTotal: Math.round(updatedTotal),
            discount,
            couponId: coupon._id.toString(),
        };
    } catch (error) {
        // Ensure error has statusCode
        error.statusCode = error.statusCode || orderConfig.errorCodes.serverError;
        throw error;
    }
}