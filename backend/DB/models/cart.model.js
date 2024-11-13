import mongoose, { model } from "mongoose";

const cartSchema = new mongoose.Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    ingredients:[{ 
        IngredientID:{ 
            type: Schema.Types.ObjectId,
            ref: 'Ingredient' 
        },
        quantity:{ 
            type: Number,
            required: true
        },
        basePrice:{
            type:Number,
            required:true,
            default:0
        },
        finalPrice:{
            type:Number,
            required:true
        },
        title:{
            type:String,
            required:true
        }
    }]
    ,
    subTotal:{
            type:Number,
            required:true,
            default:0
    },
},{timestamps:true});

const Cart = mongoose.models.Cart || model('Cart',cartSchema)
export default Cart;