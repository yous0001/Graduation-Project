import mongoose, { model } from "mongoose";

const reviewSchema = new mongoose.Schema({
    comment: {
        type: String,
        trim: true,
    },
    rate: {
        type: Number,
        min: 1,
        max: 5,
        required: true, 
    },
    userID: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
    },
    recipe: {
        type: mongoose.Types.ObjectId,
        ref: "Recipe",
        default: null,
    },
    ingredient: {
        type: mongoose.Types.ObjectId,
        ref: "Ingredient",
        default: null,
    },
    likes: [
        {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
    ],
    dislikes: [
        {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
    ],
}, {
timestamps: true,
});

const Review = mongoose.models.Review || model('Review',reviewSchema)
export default Review;