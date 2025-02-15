import mongoose, { model, Schema } from "mongoose";

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
        unique: true
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
            enum: ['percentage', 'fixed'],
            default: 'percentage'
        }
    },
    appliedPrice: {
        type: Number,
        required: true,
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