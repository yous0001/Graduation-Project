import mongoose from "../global-setup.js";
import { discountTypes } from "../../SRC/utils/enums.utils.js";

const {Schema,model}=mongoose
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
            enum: Object.values(discountTypes),
            default: discountTypes.percentage
        }
    },
    appliedPrice: {
        type: Number,
        required: true,
        default: function() {
                let appliedPrice = this.basePrice;
                switch (this.discount.type) {
                    case discountTypes.percentage:
                        appliedPrice = (ingredient.basePrice * (1 - ingredient.discount.amount / 100)).toFixed(2);
                        break;
                    case discountTypes.fixed:
                        appliedPrice = (ingredient.basePrice - ingredient.discount.amount).toFixed(2);
                        break;
                }
                appliedPrice = parseFloat(appliedPrice);
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