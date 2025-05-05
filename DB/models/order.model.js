import mongoose from "mongoose"
import { orderStatuses, paymentMethods } from "../../SRC/utils/enums.utils";

const { Schema, model } = mongoose

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            ingredientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Ingredient',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    subtotal: {
        type: Number,
        required: true
    },
    fromCart:{
        type: Boolean,
        required: true,
        default: false
    },
    vat: {
        type: Number,
        required: true,
        min:0,
        max:100,
        default: 14 
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    estimatedDeliveryDate: {
        type: Date,
        required: true,
        default: Date.now+(3*60*60*1000)
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: Object.values(paymentMethods),
        required: true
    },
    orderStatus: {
        type: String,
        enum: Object.values(orderStatuses),
        default: orderStatuses.pending
    },
    deliveredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveredAt:Date,
    cancelledAt:Date,
    cancelledReason: String,
    shippingAddress: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    orderedAt: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.models.Order || model('Order', orderSchema)
export default Order;
