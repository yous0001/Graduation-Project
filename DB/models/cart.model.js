import mongoose, { model, Schema } from "mongoose";

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
        price:{
            type:Number,
            required:true,
            default:0
        }
    }]
    ,
    subTotal:{
            type:Number,
            required:true,
            default:0
    },
},{timestamps:true});

cartSchema.index({ userID: 1 });

cartSchema.post("save", async function (doc) {
    if (doc && doc.ingredients && doc.ingredients.length === 0) {
        try {
            await doc.deleteOne();
        } catch (err) {
            console.error("Error clearing empty cart:", err.message);
        }
    }
});
const Cart = mongoose.models.Cart || model('Cart',cartSchema)
export default Cart;