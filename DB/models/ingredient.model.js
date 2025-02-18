import mongoose, { model, Schema } from "mongoose";
import { discountTypes } from "../../SRC/utils/enums.utils.js";

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        default:function() {
                    return slugify(this.name,{replacement: "_",lower: true,})
                }
    },
    description:String,
    basePrice: {
        type: Number,
        required: true,
        min:1
    },
    discount: {
        amount:{
            type: Number,
            min: 0,
            default: 0
        },
        type:{
            type: String,
            enum: Object.keys(discountTypes),
            default: discountTypes.percentage
        }
    },
    appliedPrice: {
        type: Number,
        required: true,
        default: function() {
                let appliedPrice = this.basePrice;
                    switch (this.discount.type) {
                        case "percentage":
                            appliedPrice = this.basePrice * (1 - this.discount.amount / 100);
                            break;
                        case "fixed":
                            appliedPrice = this.basePrice - this.discount.amount;
                            break;
                    }
                return appliedPrice;
            }
    },
    stock:{
        type: Number,
        min: 0,
        required: true,
    },
    image: {
        secure_url:{type:String},
        public_id:{type:String} 
    },
    Average_rating: {
        type: Number,
        min:0,
        max:5,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
},{timestamps:true});

const Ingredient = mongoose.models.Ingredient || model('Ingredient',ingredientSchema)
export default Ingredient;