import Cart from "../../../DB/models/cart.model.js";
import Ingredient from "../../../DB/models/ingredient.model.js";


export const addToCart=async(req, res, next) => {
    const { ingredientId, quantity } = req.body;
    const user = req.user;

    const ingredient = await Ingredient.findOne({_id:ingredientId, stock:{$gte:quantity}});
    if(!ingredient){
        return res.status(404).json({ message: 'Ingredient not available' });
    }

    const cart = await Cart.findOne({ userID: user._id });
    if(!cart){
        const subTotal=quantity*ingredient.appliedPrice
        const newCart = await Cart.create({ userID: user._id, ingredients: [{ IngredientID:ingredient._id, quantity, price:ingredient.appliedPrice }],subTotal });
        return res.status(200).json({ message:"add to cart successfully", cart:newCart})
    }

    const isIngredeintInCart=cart.ingredients.find(ingred=>ingred.IngredientID==ingredientId)
    if(isIngredeintInCart){
        return res.status(400).json({ message: 'Ingredient already in cart' });
    }
    cart.ingredients.push({ IngredientID:ingredient._id, quantity, price:ingredient.appliedPrice })
    cart.subTotal +=quantity*ingredient.appliedPrice
    await cart.save()

    return res.status(200).json({ message:"add to cart successfully", cart})
}

export const getCart=async(req,res,next)=>{
    const user = req.user;
    const cart = await Cart.findOne({ userID: user._id }).populate('ingredients.IngredientID',"-createdAt -updatedAt -__v -image.public_id");
    if(!cart){
        return res.status(200).json({ message: 'Cart is empty',cart:{ingredients:[],userID:user._id,subTotal:0}});
    }
    return res.status(200).json({ cart });
}

export const removeFromCart=async(req,res,next)=>{
    const { ingredientId } = req.params;
    const user = req.user;
    const cart = await Cart.findOne({ userID: user._id ,"ingredients.IngredientID":ingredientId});
    if(!cart){
        return res.status(404).json({ message: 'ingredient not found in cart' });
    }
    //cart.subTotal -= cart.ingredients.find(ingred=>ingred.IngredientID==ingredientId).price*cart.ingredients.find(ingred=>ingred.IngredientID==ingredientId).quantity
    cart.ingredients=cart.ingredients.filter(ingred=>ingred.IngredientID!=ingredientId)
    cart.subTotal=0
    cart.ingredients.forEach(ingredient => {
        cart.subTotal += ingredient.price*ingredient.quantity;
    });
    await cart.save()
    res.status(200).json({cart})
}
export const updateCart=async(req,res,next)=>{
    const { ingredientId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const cart = await Cart.findOne({ userID: user._id ,"ingredients.IngredientID":ingredientId});
    if(!cart){
        return res.status(404).json({ message: 'ingredient not found in cart' });
    }

    const ingredient=await Ingredient.findOne({_id:ingredientId, stock:{$gte:quantity}})
    if(!ingredient){
        return res.status(400).json({ message: 'Ingredient not available' });
    }

    cart.ingredients.find(ingred=>ingred.IngredientID==ingredientId).quantity=quantity
    cart.subTotal=0
    cart.ingredients.forEach(ingredient => {
        cart.subTotal += ingredient.price*ingredient.quantity;
    });
    await cart.save()
    res.status(200).json({message:"updated sucess",cart})
}


export const clearCart=async(req,res,next)=>{
    const user = req.user;
    const cart = await Cart.findOneAndDelete({ userID: user._id });
    res.status(200).json({ message:"cart cleared successfully"})
}