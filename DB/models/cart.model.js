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

cartSchema.post("save",async (doc)=>{
    if(doc.ingredients.length===0){
        console.log("deleteing cart because no ingredients in it");
        await Cart.deleteOne({userID: doc.userID})
    }
})
const Cart = mongoose.models.Cart || model('Cart',cartSchema)
export default Cart;