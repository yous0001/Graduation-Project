import mongoose, { model } from "mongoose";

const reviewSchema = new mongoose.Schema({
    userID:{ 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
    recipeID:{ 
        type: Schema.Types.ObjectId,
        ref: 'Recipe' 
    },
    ingredientID:{
        type: Schema.Types.ObjectId,
        ref: 'Ingredient' 
    },
    rating:{ 
        type: Number,
        required: true 
    },
    comment:String
},{timestamps:true});

const Review = mongoose.models.Review || model('Review',reviewSchema)
export default Review;