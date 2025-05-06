import Cart from '../../../DB/models/cart.model.js';

export const createOrderByCart=async(req,res,next)=>{
    const userId=req.user._id;
    const {shippingAddress,contactNumber,couponCode,paymentMethod,shippingFee,vat}=req.body;
    const cart=await Cart.findOne({userID:userId}).populate('ingredients.IngredientID')
    
    if(!cart||cart.ingredients.length==0){
        return res.status(400).json({message:"cart is empty"});
    }

    const isNotAvaliable=cart.ingredients.find(ing=>ing.IngredientID.stock<ing.quantity)
    if(isNotAvaliable){
        return res.status(400).json({message:`ingredient ${isNotAvaliable.IngredientID.name} is not available`});
    }
    const subTotal=cart.subTotal;
    const total=subTotal+shippingFee+(subTotal*vat/100)

}