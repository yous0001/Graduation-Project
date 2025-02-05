import mongoose, { model } from "mongoose";

const recipeSchema = new mongoose.Schema({
    title: { 
        type: String,
        required: true 
    },
    description: { 
        type: String
    },
    ingredients: [{ 
        type: Schema.Types.ObjectId,
            ref: 'Ingredient' 
    }],
    directions: { 
        type: [String],
        required: true 
    },
    images: [String],
    category: { 
        type: Schema.Types.ObjectId,
        ref: 'Category' 
    },
    country: { 
        type: Schema.Types.ObjectId,
        ref: 'Country' 
    },
    Average_rating: {
        type: Number,
        min:0,
        max:5,
        default: 0 
    },
    createdBy: {
        type:Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type:Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps:true});

const Recipe = mongoose.models.Recipe || model('Recipe',recipeSchema)
export default Recipe;