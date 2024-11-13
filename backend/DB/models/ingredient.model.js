import mongoose, { model } from "mongoose";

const ingredientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    basePrice: {
        type: Number,
        required: true,
    },
    discountPrice: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    Average_rating: {
        type: Number,
        default: 0,
    }
},{timestamps:true});

const Ingredient = mongoose.models.Ingredient || model('Ingredient',ingredientSchema)
export default Ingredient;