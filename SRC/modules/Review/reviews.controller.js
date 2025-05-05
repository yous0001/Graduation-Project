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
        const existingReview = await Review.findOne({ recipe: recipeId, userID });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this recipe" });
        }
    } else if (ingredientId) {
        targetModel = Ingredient;
        targetDoc = await Ingredient.findById(ingredientId);
        if (!targetDoc) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        const existingReview = await Review.findOne({ ingredient: ingredientId, userID });
        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this ingredient" });
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
    let populatedReview=await Review.findById(newReview._id).populate({path:"userID",select:"username email profileImage.secure_url"});
    //average*numberOfRating=>totalreviews
    //totalReviews+rate/(numberOfReviews+1)=>to get new average
    targetDoc.Average_rating=(targetDoc.Average_rating*(targetDoc.number_of_ratings)+rate)/(targetDoc.number_of_ratings+1)
    targetDoc.number_of_ratings=targetDoc.number_of_ratings+1
    await targetDoc.save();
    
    populatedReview=populatedReview.toObject();
    populatedReview.likesCount=populatedReview.likes.length||0;
    populatedReview.dislikesCount=populatedReview.dislikes.length||0;

    res.status(201).json({ message: "Review added successfully", review: populatedReview });
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

export const deleteReview = async (req, res, next) => {
    const { reviewId } = req.params;
    const userID = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({ message: "Review not found" });
    }

    if (review.userID.toString() !== userID.toString()) {
        return res.status(403).json({ message: "You are not allowed to delete this review" });
    }

    let targetDoc = null;
    if (review.recipe) {
        targetDoc = await Recipe.findById(review.recipe);
    } else if (review.ingredient) {
        targetDoc = await Ingredient.findById(review.ingredient);
    }

    if (!targetDoc) {
        return res.status(404).json({ message: "Target item not found" });
    }
    //average*numberOfRating=>totalreviews
    const total = targetDoc.Average_rating * targetDoc.number_of_ratings;
    targetDoc.number_of_ratings -= 1;

    if (targetDoc.number_of_ratings === 0) {
        targetDoc.Average_rating = 0;
    } else {
        const newTotal = total - review.rate;//decrease total by value of review rate so that we return total to last state
        targetDoc.Average_rating = newTotal / targetDoc.number_of_ratings;//calculate new average by dividing total by number of ratings after we decrement it 
    }

    await targetDoc.save();
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "Review deleted successfully" });
};

export const updateReview = async (req, res, next) => {
    const { reviewId } = req.params;
    const { rate, comment } = req.body;
    const userID = req.user._id;

    let review = await Review.findById(reviewId);
    if (!review) {
        return res.status(404).json({ message: "Review not found" });
    }

    if (review.userID.toString() !== userID.toString()) {
        return res.status(403).json({ message: "You are not allowed to update this review" });
    }

    let targetDoc = null;
    if (review.recipe) {
        targetDoc = await Recipe.findById(review.recipe);
    } else if (review.ingredient) {
        targetDoc = await Ingredient.findById(review.ingredient);
    }

    if (!targetDoc) {
        return res.status(404).json({ message: "Target item not found" });
    }

    // Update average rating if the rate changed
    if (rate && rate !== review.rate) {
        const total = targetDoc.Average_rating * targetDoc.number_of_ratings;//get total rating
        const newTotal = total - review.rate + rate;//remove last  rate and add new rate
        targetDoc.Average_rating = newTotal / targetDoc.number_of_ratings;//calculate new average
        review.rate = rate;//change it in review model
    }

    if (comment !== undefined) review.comment = comment;//we don't make it !comment to handle if user wants to remove comment
    await review.save();
    await targetDoc.save();

    review=review.toObject();
    review.likesCount=review.likes.length||0;
    review.dislikesCount=review.dislikes.length||0;
    res.status(200).json({ message: "Review updated successfully", review });
};

export const getReviews = async (req, res, next) => {
    const { recipeId, ingredientId } = req.query;
    if (!recipeId && !ingredientId) {
        return res.status(400).json({ message: "Please provide either recipeId or ingredientId" });
    }

    if (recipeId && ingredientId) {
        return res.status(400).json({ message: "Please provide only one of recipeId or ingredientId, not both" });
    }
    const reviews = await Review.find({ recipe: recipeId || null, ingredient: ingredientId || null }).populate({path:"userID",select:"username email profileImage.secure_url"});
    const reviewsWithCounts = reviews.map((review) => ({
        ...review.toObject(),
        likesCount: review.likes?.length || 0,
        dislikesCount: review.dislikes?.length || 0
    }));
    res.status(200).json({ reviews:reviewsWithCounts });
};