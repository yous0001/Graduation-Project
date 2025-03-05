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