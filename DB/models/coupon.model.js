import mongoose from "mongoose";
import { discountTypes } from "../../SRC/utils/enums.utils.js";

const { model } = mongoose;

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: Object.values(discountTypes),
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    maxDiscountAmount: {
      type: Number,
      default: 250,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.models.Coupon || model("Coupon", couponSchema);
export default Coupon;
