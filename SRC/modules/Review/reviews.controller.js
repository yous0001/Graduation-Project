import Ingredient from "../../../DB/models/ingredient.model.js";
import Recipe from "../../../DB/models/recipe.model.js";
import Review from "../../../DB/models/review.model.js";

export const addReview=async(req,res,next)=>{
    const { recipeId, ingredientId, rate, comment } = req.body;
    const userID = req.user._id; // assume user is logged in

    if (!rate || (!recipeId && !ingredientId)) {
        return res.status(400).json({ message: "Missing required fields" });
    }
  
    if (recipeId && ingredientId) {
        return res.status(400).json({ message: "Review can be for either recipe or ingredient, not both." });
    }

    let targetModel = null;
    let targetDoc = null;

    // Validate recipe or ingredient existence
    if (recipeId) {
        targetModel = Recipe;
        targetDoc = await Recipe.findById(recipeId);
        if (!targetDoc) {
            return res.status(404).json({ message: "Recipe not found" });
        }
    } else if (ingredientId) {
        targetModel = Ingredient;
        targetDoc = await Ingredient.findById(ingredientId);
        if (!targetDoc) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
    }
    const newReview = await Review.create({
        rate,
        comment,
        userID,
        recipe: recipeId || null,
        ingredient: ingredientId || null,
    });

    if (!newReview) 
        return res.status(500).json({ message: "Failed to create review" });

    //average*numberOfRating=>totalreviews
    //totalReviews+rate/(numberOfReviews+1)=>to get new average
    targetDoc.Average_rating=(targetDoc.Average_rating*(targetDoc.number_of_ratings)+rate)/(targetDoc.number_of_ratings+1)
    targetDoc.number_of_ratings=targetDoc.number_of_ratings+1
    await targetDoc.save();

    res.status(200).json({ message: "Review added successfully", review: newReview });
}

export const addReaction=async(req,res,next)=>{
    const { reviewId } = req.params;
    const { action } = req.query; // "like" or "dislike"
    const userId = req.user._id;
    
    if (!["like", "dislike"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'like' or 'dislike'." });
    }
    
    const review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({ message: "Review not found." });
    }
    
    const alreadyLiked = review.likes.includes(userId);
    const alreadyDisliked = review.dislikes.includes(userId);

    if (action === "like") {
        if (alreadyLiked) {
        review.likes.pull(userId); //if already liked toggle off
        } else {
        review.likes.push(userId);//if not already liked toggle on
        if (alreadyDisliked) review.dislikes.pull(userId); //if already disliked toggle off
        }
    }

    if (action === "dislike") {
        if (alreadyDisliked) {
        review.dislikes.pull(userId); //if already disliked toggle off
        } else {
        review.dislikes.push(userId); //if not already disliked toggle on
        if (alreadyLiked) review.likes.pull(userId); //if already liked toggle off
        }
    }
    
    await review.save();
    return res.status(200).json({
        message: `added ${action} to review successfully`,
        likes: review.likes.length,
        dislikes: review.dislikes.length,
    });
    
}