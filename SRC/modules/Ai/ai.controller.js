import axios from "axios";
import { validGoals } from "../../utils/enums.utils.js";
import { enhanceRecipesGemini, generateDietPlan, generateImage, generateImageForGemini, generateRecipeByMood, generateRecipeGemini, generateRecipeM1 } from "../Services/ai.services.js";
import { generateDietPlanPdf } from "../Services/pdf.services.js";
import { dietPlanEmailTemplate } from './../Services/emailTempletes.js';
import sendmailservice from './../Services/sendMail.js';


export const getRecommendation = async (req, res, next) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ message: 'Ingredients are required' });
        }

        const result = await generateRecipeGemini(ingredients)
        const { recipeJson, recipeMarkdown } = result
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

export const getLegacyRecommendation = async (req, res, next) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ message: 'Ingredients are required' });
        }

        const result = await generateRecipeM1(ingredients)
        const image = await generateImage(result)
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

export const getRecipeByMood = async (req, res, next) => {
    try {
        const { mood } = req.body;

        const result = await generateRecipeByMood(mood)
        const { recipeJson, recipeMarkdown } = result
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
            return res.status(400).json({ error: 'All fields (height, age, weight, fatPercentage, goal, preferences, gender) are required' });
        }

        // Validate goal
        const normalizedGoal = goal.trim().toLowerCase();
        if (!Object.values(validGoals).includes(normalizedGoal)) {
            return res.status(400).json({ error: `Invalid goal. Must be one of: ${Object.values(validGoals).join(', ')}` });
        }

        if (!user?.email) {
            console.warn('User email missing, skipping email');
            return res.status(400).json({ error: 'User email required' });
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

        res.json(dietPlan);
    } catch (error) {
        console.error('Error in /ai/diet-plan:', error);
        res.status(500).json({ error: 'Failed to generate diet plan' });
        next(error);
    }
};


export const searchWithAi = async (req, res, next) => {
    try {
        const { ingredients, start, count } = req.body;

        const {data: response} = await axios.post('http://127.0.0.1:5000/recommend', {
            ingredients,
            start,
            count
        });
        const enhancedRecipes = await enhanceRecipesGemini(response.recommendations)
        for (const recipe of enhancedRecipes) {
            const image = await generateImageForGemini(recipe.recipeJson)
            recipe.image = image
        }
        res.status(200).json({message: 'Recipe suggestion retrieved successfully', enhancedRecipes});

    } catch (error) {
        console.error('Error in searchWithAi:', error.message);
        res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
};