import { generateImage, generateImageForGemini, generateRecipeByMood, generateRecipeGemini, generateRecipeM1 } from "../Services/ai.services.js";


export const getRecommendation = async (req, res, next) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ message: 'Ingredients are required' });
        }

        const result = await generateRecipeGemini(ingredients)
        const {recipeJson,recipeMarkdown}=result
        const image = await generateImageForGemini(recipeJson)
        res.status(200).json({
            message: 'Recipe suggestion retrieved successfully',
            recipeJson,
            recipeMarkdown,
            image
        });
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to fetch recipe suggestion',
            error: error?.response?.data || error.message,
        });
    }
}

export const getLegacyRecommendation=async(req,res,next)=>{
    try {
        const { ingredients } = req.body;
    
        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ message: 'Ingredients are required' });
        }
        
        const result = await generateRecipeM1(ingredients)
        const image=await generateImage(result)
        res.status(200).json({
            message: 'Recipe suggestion retrieved successfully',
            suggestion: result,
            image
        });
    } catch (error) {
            console.error(error?.response?.data || error.message);
            res.status(500).json({
            message: 'Failed to fetch recipe suggestion',
            error: error?.response?.data || error.message,
            });
    }
}

export const getRecipeByMood=async(req,res,next)=>{
    try {
        const { mood } = req.body;

        const result = await generateRecipeByMood(mood)
        const {recipeJson,recipeMarkdown}=result
        console.log(recipeJson)
        const image = await generateImageForGemini(recipeJson)
        res.status(200).json({
            message: 'Recipe suggestion retrieved successfully',
            recipeJson,
            recipeMarkdown,
            image
        });
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({
            message: 'Failed to fetch recipe suggestion',
            error: error?.response?.data || error.message,
        });
    }
}