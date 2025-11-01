import axios from "axios";
import { validGoals } from "../../utils/enums.utils.js";
import { enhanceRecipesGemini, generateDietPlan, generateImage, generateImageForGemini, generateRecipeByMood, generateRecipeGemini, generateRecipeM1 } from "../Services/ai.services.js";
import { generateDietPlanPdf } from "../Services/pdf.services.js";
import { dietPlanEmailTemplate } from './../Services/emailTempletes.js';
import sendmailservice from './../Services/sendMail.js';
import Recommendation from "../../../DB/models/recommended.model.js";
import slugify from "slugify";
import chalk from "chalk";


export const getRecommendation = async (req, res, next) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ success: false, message: 'Ingredients are required' });
        }

        const result = await generateRecipeGemini(ingredients)
        const { recipeJson, recipeMarkdown } = result
        const image = await generateImageForGemini(recipeJson)
        res.status(200).json({
            success: true,
            message: 'Recipe suggestion retrieved successfully',
            recipeJson,
            recipeMarkdown,
            image
        });
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recipe suggestion',
            error: error?.response?.data || error.message,
        });
    }
}

export const getLegacyRecommendation = async (req, res, next) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ success: false, message: 'Ingredients are required' });
        }

        const result = await generateRecipeM1(ingredients)
        const image = await generateImage(result)
        res.status(200).json({
            success: true,
            message: 'Recipe suggestion retrieved successfully',
            suggestion: result,
            image
        });
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recipe suggestion',
            error: error?.response?.data || error.message,
        });
    }
}

export const getRecipeByMood = async (req, res, next) => {
    try {
        const { mood } = req.body;

        const result = await generateRecipeByMood(mood)
        const { recipeJson, recipeMarkdown } = result
        console.log(recipeJson)
        const image = await generateImageForGemini(recipeJson)
        res.status(200).json({
            success: true,
            message: 'Recipe suggestion retrieved successfully',
            recipeJson,
            recipeMarkdown,
            image
        });
    } catch (error) {
        console.error(error?.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recipe suggestion',
            error: error?.response?.data || error.message,
        });
    }
}


export const getDietPlan = async (req, res, next) => {
    try {
        const user = req.user;
        const {
            height,
            age,
            weight,
            fatPercentage,
            goal,
            preferences,
            gender,
            activityLevel = 'moderately_active',
            trainingExperience = 'beginner',
        } = req.body;

        // Validate required fields
        if (!height || !age || !weight || !fatPercentage || !goal || !preferences || !gender) {
            return res.status(400).json({ success: false, error: 'All fields (height, age, weight, fatPercentage, goal, preferences, gender) are required' });
        }

        // Validate goal
        const normalizedGoal = goal.trim().toLowerCase();
        if (!Object.values(validGoals).includes(normalizedGoal)) {
            return res.status(400).json({ success: false, error: `Invalid goal. Must be one of: ${Object.values(validGoals).join(', ')}` });
        }

        if (!user?.email) {
            console.warn('User email missing, skipping email');
            return res.status(400).json({ success: false, error: 'User email required' });
        }

        const dietPlan = await generateDietPlan({
            height,
            age,
            weight,
            fatPercentage,
            goal: normalizedGoal,
            preferences,
            gender,
            activityLevel,
            trainingExperience,
        });
        dietPlan.goal = goal
        let pdfBuffer;
        try {
            const userData = {
                height,
                age,
                weight,
                fatPercentage,
                gender,
                activityLevel,
                trainingExperience,
            };
            pdfBuffer = await generateDietPlanPdf(dietPlan, 30, preferences, userData);
        } catch (error) {
            console.error('Error generating PDF:', error.message);
        }

        if (pdfBuffer) {
            const emailSubject = 'Your Personalized 30-Day Diet Plan';
            const emailMessage = dietPlanEmailTemplate({
                goal: normalizedGoal,
                totalCalories: dietPlan.totalCalories,
                preferences,
                appLink: process.env.APP_LINK || 'https://reciplore.app',
            });
            const attachments = [
                {
                    filename: 'Diet_Plan.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ];

            try {
                const emailSent = await sendmailservice({
                    to: user.email,
                    subject: emailSubject,
                    message: emailMessage,
                    attachments,
                });
                if (!emailSent) {
                    console.error('Failed to send email to', user.email);
                } else {
                    console.log('Email sent successfully to', user.email);
                }
            } catch (error) {
                console.error('Error sending email:', error.message);
            }
        } else {
            console.warn('PDF generation failed, skipping email');
        }

        res.status(200).json({ success: true, ...dietPlan });
    } catch (error) {
        console.error('Error in /ai/diet-plan:', error);
        res.status(500).json({ success: false, error: 'Failed to generate diet plan' });
        next(error);
    }
};


export const searchWithAi = async (req, res, next) => {
    try {
        const { ingredients, start, count } = req.body;

        // Validate input
        if (!ingredients) {
            return res.status(400).json({ success: false, message: 'Ingredients is required' });
        }

        // Call Flask API to get initial recommendations
        const { data: response } = await axios.post('http://127.0.0.1:5000/recommend', {
            ingredients,
            start,
            count
        });

        //console.log('Response from Flask API fetchRecommendations:', response.recommendations);


        let recommendations = response.recommendations || [];

        recommendations = recommendations.map(r => ({
        ...r,
        title: slugify(r.title, { lower: true })
        }));

        const existingRecipes = await Recommendation.find({
            originalTitle: { $in: recommendations.map(r => r.title) }
        }).lean();


        const existingRecipesFormatted = existingRecipes.map(recipe => ({
            originalTitle: recipe.originalTitle,
            recipeJson: recipe.recipeJson,
            recipeMarkdown: recipe.recipeMarkdown,
            image: { imageUrl: recipe.image.imageUrl },
            category: recipe.category
        }));


        const existingTitles = new Set(existingRecipes.map(r => r.originalTitle));
        const newRecommendations = recommendations.filter(r => !existingTitles.has(r.title));
        console.log(chalk.bgGreen(`${existingTitles.size} recipes already exist.`));
        console.log(chalk.bgYellow(`${newRecommendations.length} new recipes to be enhanced.`));

        let enhancedRecipes = [];
        if (newRecommendations.length > 0) {
            enhancedRecipes = await enhanceRecipesGemini(newRecommendations);

            

            for (const recipe of enhancedRecipes) {
                try {
                    //console.log(recipe);
                    let imageUrl = await generateImageForGemini(recipe.recipeJson);
                    recipe.image = { imageUrl };


                    const titleLower = recipe.originalTitle.toLowerCase();
                    let category = 'Other';
                    if (titleLower.includes('breakfast')) category = 'Breakfast';
                    else if (titleLower.includes('dessert')) category = 'Dessert';
                    else if (titleLower.includes('snack')) category = 'Snack';
                    const recommendation = new Recommendation({
                        originalTitle: recipe.originalTitle,
                        recipeJson: recipe.recipeJson,
                        recipeMarkdown: recipe.recipeMarkdown,
                        image: recipe.image,
                        originalIngredients: recommendations.find(r => r.title === recipe.originalTitle)?.ingredients || [],
                        category
                    });
                    await recommendation.save();
                } catch (error) {
                    console.error(`Failed to generate image or save recipe ${recipe.originalTitle}:`, error.message);
                    recipe.image = { imageUrl: 'https://via.placeholder.com/800x400?text=Recipe+Image' };
                    const recommendation = new Recommendation({
                        originalTitle: recipe.originalTitle,
                        recipeJson: recipe.recipeJson,
                        recipeMarkdown: recipe.recipeMarkdown,
                        image: recipe.image,
                        originalIngredients: recommendations.find(r => r.title === recipe.originalTitle)?.ingredients || [],
                        category: 'Other'
                    });
                    await recommendation.save();
                }
            }
        }

        const allRecipes = [...existingRecipesFormatted, ...enhancedRecipes];

        res.status(200).json({
            success: true,
            message: 'Recipe suggestions retrieved successfully',
            enhancedRecipes: allRecipes
        });
    } catch (error) {
        console.error('Error in searchWithAi:', error.message);
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};
