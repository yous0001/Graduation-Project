import axios from "axios";
import { uploadFile, uploadFileBuffer } from "../../utils/cloudinary.utils.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from 'marked';
import { parse } from 'node-html-parser';


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

//under development
async function generateRecipeM1(ingredients) {
    try {
        ingredients = `Ingredients: ${ingredients} you can add more ingredients if needed. Give me a full recipe with steps and ingredients.`
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/flax-community/t5-recipe-generation",
            {
                inputs: ingredients + "note: give me most similar recipe without error please",
                parameters: {
                    max_length: 50000,
                    do_sample: true,
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                },
            }
        );

        return response.data[0]?.generated_text;
    } catch (error) {
        console.error("Error generating recipe:", error.response?.data || error.message);
        throw error;
    }
}

//under development
async function generateRecipeM2(ingredients) {
    try {
        const response = await axios.post(
            "https://api-inference.huggingface.co/models/Ashikan/dut-recipe-generator",
            {
                inputs: `Ingredients: ${ingredients}. Generate a healthy recipe.`,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                },
            }
        );
        return response.data[0]?.generated_text;
    } catch (error) {
        console.error('Error generating recipe:', error.response?.data || error.message);
        throw error;
    }
}



//under development
async function generateRecipeM3(ingredients) {
    try {
        const prompt = `
        You are a professional chef. A user gives you the following ingredients:
        ${ingredients}
        
        Generate a complete recipe that uses these ingredients. Include:
        - A short dish title
        - Ingredients list
        - Preparation steps
        `;

        const response = await axios.post(
            "https://api-inference.huggingface.co/models/gpt2",
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                },
            }
        );

        // Output the response from the model
        const generatedRecipe = response;
        console.log('Generated Recipe:', generatedRecipe);
        return generatedRecipe;
    } catch (error) {
        console.error('Error:', error);
    }
}

//under development
async function generateRecipeImage(recipeDescription) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                prompt: recipeDescription,
                n: 1,
                size: "512x512"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_KEY}`
                }
            }
        );
        const imageBuffer = Buffer.from(response.data, "binary").toString("base64");
        const imageUrl = `data:image/png;base64,${imageBuffer}`;
        //imageBuffer = Buffer.from(response.data);
        console.log("Image generated successfully!");
        return imageUrl;
    } catch (error) {
        console.error("Error generating image:", error.response?.data || error.message);
        throw error;
    }
}

async function generateImage(prompt) {
    const API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
    const headers = {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json'
    };
    //prompt=prompt.split("ingredients")[0]
    //console.log(prompt)
    const data = {
        inputs: prompt + " note:please make it be looks delicious as much as possible , i need one image for the output recipe"
    };

    try {
        const response = await axios.post(API_URL, data, { headers, responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Upload the buffer directly
        const uploadResult = await uploadFileBuffer({
            buffer: imageBuffer,
            filename: 'recipe_temp.png',
            folder: `${process.env.UPLOADS_FOLDER}/chat-recipes`,
        });

        return uploadResult.secure_url;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function generateRecipeGemini(ingredients) {
    try {
        // Initialize the Gemini API client
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Select the model (e.g., gemini-1.5-flash for text generation)
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            apiVersion: 'v1beta',
        });

        // Format the prompt for recipe generation
        const prompt = `
      You are a professional chef. Create a detailed recipe using the following ingredients: ${ingredients}.
      You may add common ingredients (e.g., salt, pepper, oil, water) if needed to complete the recipe.
      Format the recipe in markdown with the following structure:

      # Recipe Title

      ## Overview
      - **Cuisine**: [e.g., American, Italian]
      - **Difficulty**: [Easy, Medium, Hard]
      - **Servings**: [e.g., 4 servings]
      - **Prep Time**: [e.g., 15 minutes]
      - **Cook Time**: [e.g., 20 minutes]
      - **Total Time**: [e.g., 35 minutes]
      - **Dietary Tags**: [e.g., Vegetarian, Gluten-Free]

      ## Description
      [Brief description of the dish, its flavors, and occasion]

      ## Ingredients
      - [Quantity] [ingredient] (e.g., 1 cup flour)
      - [Include substitutes in parentheses if applicable, e.g., (or substitute: 1 cup milk + 1 tbsp vinegar)]

      ## Instructions
      1. **[Action Verb]**: [Step description, concise and clear]
      2. ...

      ## Tips and Variations
      - [Tip or variation, e.g., Add 1 tsp vanilla for extra flavor]
      - [Storage instructions, e.g., Store in fridge for 3 days]

      ## Nutritional Information (Approximate, per serving)
      - Calories: [e.g., 150 kcal]
      - Protein: [e.g., 4g]
      - Fat: [e.g., 6g]
      - Carbohydrates: [e.g., 20g]

      Ensure the recipe is clear, practical, and error-free. If the ingredients are insufficient, suggest a recipe that closely matches and explain additions. Use consistent units (e.g., tbsp, tsp, cups) and bold action verbs in instructions.
    `;

        const result = await model.generateContent(prompt);
        const markdownText = result.response.text().trim();

        if (!markdownText) {
            throw new Error('No recipe generated by Gemini API');
        }

        // Parse markdown to JSON
        const recipeJson = await parseMarkdownToJson(markdownText);
        return {recipeJson,recipeMarkdown:markdownText};
    } catch (error) {
        console.error('Error generating recipe with Gemini:', error.message, error.response?.data || {});
        throw error;
    }
}

async function parseMarkdownToJson(markdownText) {
    // Convert markdown to HTML
    const html = await marked(markdownText);
    const root = parse(html);

    // Extract title
    const title = root.querySelector('h1')?.textContent || '';

    // Extract overview
    const overview = {};
    const overviewItems = root.querySelectorAll('h2:contains("Overview") + ul li');
    overviewItems.forEach(item => {
        const [key, value] = item.textContent.split(': ').map(s => s.replace(/\*\*/g, '').trim());
        overview[key.toLowerCase().replace(' ', '')] = value;
    });
    overview.dietaryTags = overview.dietaryTags ? overview.dietaryTags.split(', ').map(tag => tag.trim()) : [];

    // Extract description
    const description = root.querySelector('h2:contains("Description") + p')?.textContent || '';

    // Extract ingredients
    const ingredients = root.querySelectorAll('h2:contains("Ingredients") + ul li').map(item => {
        const text = item.textContent.trim();
        const match = text.match(/^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞]+)?\s*([a-zA-Z\s]+?)(?:\s*\((.*?)\))?$/);
        return {
            quantity: match?.[1]?.trim() || '',
            name: match?.[2]?.trim() || text,
            substitute: match?.[3]?.includes('substitute') ? match[3].replace(/.*substitute:\s*/, '').trim() : undefined,
            notes: match?.[3] && !match[3].includes('substitute') ? match[3].trim() : undefined
        };
    });

    // Extract instructions
    const instructions = root.querySelectorAll('h2:contains("Instructions") + ol li').map((item, index) => {
        const [action, ...desc] = item.textContent.split(': ');
        return {
            step: index + 1,
            action: action.replace(/\*\*/g, '').trim(),
            description: desc.join(': ').trim()
        };
    });

    // Extract tips
    const tipsAndVariations = root.querySelectorAll('h2:contains("Tips and Variations") + ul li').map(item => item.textContent.trim());

    // Extract nutrition
    const nutrition = {};
    const nutritionItems = root.querySelectorAll('h2:contains("Nutritional Information") + ul li');
    nutritionItems.forEach(item => {
        const [key, value] = item.textContent.split(': ').map(s => s.trim());
        if (key.toLowerCase() !== 'note') {
            nutrition[key.toLowerCase()] = value;
        } else {
            nutrition.note = value;
        }
    });

    return {
        title,
        overview,
        description,
        ingredients,
        instructions,
        tipsAndVariations,
        nutrition
    };
}


async function generateImageForGemini(recipeJson) {
    const API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
    const headers = {
        Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
    };

    // Craft a prompt from the recipe JSON
    const prompt = `
      A beautifully plated dish of ${recipeJson.title.toLowerCase()}, showcasing ${recipeJson.description.split('.')[0].toLowerCase()}. 
      The presentation is vibrant, appetizing, and professionally styled, with garnishes and a clean, modern background. 
      Emphasize rich colors, fresh ingredients, and a delicious, inviting look. 
      One high-quality image for a recipe display.
    `;

    const data = {
        inputs: prompt,
    };

    try {
        // Call Hugging Face Stable Diffusion API
        const response = await axios.post(API_URL, data, { headers, responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Upload the buffer (assumes uploadFileBuffer is defined elsewhere)
        const uploadResult = await uploadFileBuffer({
            buffer: imageBuffer,
            filename: `${recipeJson.title.replace(/\s+/g, '_').toLowerCase()}.png`,
            folder: `${process.env.UPLOADS_FOLDER}/chat-recipes`,
        });

        return uploadResult.secure_url;
    } catch (error) {
        console.error('❌ Error generating image:', error.response?.data || error.message);
        return null;
    }
}