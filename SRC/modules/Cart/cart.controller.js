import Cart from "../../../DB/models/cart.model.js";
import Ingredient from "../../../DB/models/ingredient.model.js";

export const addToCart = async (req, res, _next) => {
  const { ingredientId, quantity = 1 } = req.body;
  const user = req.user;

  if (!ingredientId || quantity <= 0) {
    return res.status(400).json({ success: false, message: "Valid ingredientId and positive quantity required" });
  }

  const ingredient = await Ingredient.findOne({
    _id: ingredientId,
    stock: { $gte: quantity },
  });
  if (!ingredient) {
    return res
      .status(404)
      .json({ success: false, message: "Ingredient not available or insufficient stock" });
  }

  let cart = await Cart.findOne({ userID: user._id });
  if (!cart) {
    const subTotal = quantity * ingredient.appliedPrice;
    const newCart = await Cart.create({
      userID: user._id,
      ingredients: [
        {
          IngredientID: ingredient._id,
          quantity,
          price: ingredient.appliedPrice,
        },
      ],
      subTotal,
    });
    return res.status(200).json({
      success: true,
      message: "Added to cart successfully",
      cart: newCart,
    });
  }

  const existingItem = cart.ingredients.find(
    (item) => item.IngredientID && item.IngredientID.toString() === ingredientId.toString()
  );
  if (existingItem) {
    return res
      .status(400)
      .json({ success: false, message: "Ingredient already in cart" });
  }

  cart.ingredients.push({
    IngredientID: ingredient._id,
    quantity,
    price: ingredient.appliedPrice,
  });
  cart.subTotal = cart.ingredients.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  await cart.save();

  return res
    .status(200)
    .json({ success: true, message: "Added to cart successfully", cart });
};

export const getCart = async (req, res, _next) => {
  const user = req.user;
  const cart = await Cart.findOne({ userID: user._id }).populate(
    "ingredients.IngredientID",
    "-createdAt -updatedAt -__v -image.public_id"
  );
  return res
    .status(200)
    .json({ success: true, message: "Cart retrieved successfully", cart: cart || { ingredients: [], subTotal: 0 } });
};

export const removeFromCart = async (req, res, _next) => {
  const { ingredientId } = req.params;
  const user = req.user;
  const cart = await Cart.findOne({
    userID: user._id,
  });
  if (!cart) {
    return res
      .status(404)
      .json({ success: false, message: "Cart not found" });
  }

  const prevLen = cart.ingredients.length;
  cart.ingredients = cart.ingredients.filter(
    (item) => item.IngredientID && item.IngredientID.toString() !== ingredientId.toString()
  );

  if (cart.ingredients.length === prevLen) {
    return res.status(404).json({ success: false, message: "Ingredient not found in cart" });
  }

  cart.subTotal = cart.ingredients.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  await cart.save();

  res
    .status(200)
    .json({ success: true, message: "Removed successfully", cart });
};

export const updateCart = async (req, res, _next) => {
  const { ingredientId } = req.params;
  const { quantity } = req.body;
  const user = req.user;

  if (quantity === undefined || quantity <= 0) {
    return res.status(400).json({ success: false, message: "Valid quantity is required" });
  }

  const cart = await Cart.findOne({
    userID: user._id,
  });
  if (!cart) {
    return res
      .status(404)
      .json({ success: false, message: "Cart not found" });
  }

  const targetItem = cart.ingredients.find(
    (item) => item.IngredientID && item.IngredientID.toString() === ingredientId.toString()
  );
  if (!targetItem) {
    return res.status(404).json({ success: false, message: "Ingredient not found in cart" });
  }

  const ingredient = await Ingredient.findOne({
    _id: ingredientId,
    stock: { $gte: quantity },
  });
  if (!ingredient) {
    return res
      .status(400)
      .json({ success: false, message: "Requested quantity exceeds available stock" });
  }

  targetItem.quantity = quantity;
  targetItem.price = ingredient.appliedPrice;
  cart.subTotal = cart.ingredients.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  await cart.save();

  res
    .status(200)
    .json({ success: true, message: "Cart updated successfully", cart });
};

export const clearCart = async (req, res, _next) => {
  const user = req.user;
  await Cart.findOneAndDelete({ userID: user._id });
  res.status(200).json({ success: true, message: "Cart cleared successfully" });
};
