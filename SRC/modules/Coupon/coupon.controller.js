import Coupon from "../../../DB/models/coupon.model.js";




export const addCoupon = async (req, res, next) => {
    const { code, discountType, discountValue, maxDiscountAmount, startsAt, expiresAt, usageLimit = 10 } = req.body;
    const userId = req.user._id;

    const isCouponExists = await Coupon.findOne({ code });
    if (isCouponExists) {
        return res.status(409).json({ success: false, message: "Coupon with this code already exists" });
    }

    const now = new Date();

    if (maxDiscountAmount > 500)
        return res.status(409).json({ success: false, message: "max discount amount can't be more than 500 EGP. we want to make profit not lose. are you crasy????????" })

    if (discountType === "percentage" && discountValue > 100)
        return res.status(409).json({ success: false, message: "discount can't be more than 100%" })

    if (discountType === "fixed" && discountValue > maxDiscountAmount)
        return res.status(409).json({ success: false, message: "discount can't be more than max discount amount" })

    if (new Date(expiresAt) < new Date(startsAt) && new Date(startsAt) < now)
        return res.status(400).json({ success: false, message: "startsAt should be before expiresAt." });


    let status;


    if (new Date(expiresAt) < now) {
        status = "expired";
    } else if (new Date(startsAt) > now) {
        status = "inactive";
    } else {
        status = "active";
    }

    const couponObject = {
        code,
        discountType,
        discountValue,
        maxDiscountAmount,
        status,
        expiresAt,
        startsAt,
        usageLimit,
        createdBy: userId
    }
    const newCoupon = await Coupon.create(couponObject);

    res.status(201).json({ success: true, message: "Coupon added successfully", coupon: newCoupon });
} 