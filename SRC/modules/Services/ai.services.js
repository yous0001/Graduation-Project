import axios from "axios";
import { uploadFile, uploadFileBuffer } from "../../utils/cloudinary.utils.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from 'marked';
import { parse } from 'node-html-parser';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Select the model (e.g., gemini-1.5-flash for text generation)
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    apiVersion: 'v1beta',
});

//under development
export async function generateRecipeM1(ingredients) {
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
export async function generateRecipeM2(ingredients) {
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
export async function generateRecipeM3(ingredients) {
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
export async function generateRecipeImage(recipeDescription) {
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

export async function generateImage(prompt) {
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

export async function generateRecipeGemini(ingredients) {
    try {


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
        return { recipeJson, recipeMarkdown: markdownText };
    } catch (error) {
        console.error('Error generating recipe with Gemini:', error.message, error.response?.data || {});
        throw error;
    }
}

export async function parseMarkdownToJson(markdownText) {
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


export async function generateImageForGemini(recipeJson) {
    const API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';
    const headers = {
        Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
    };
    console.log(recipeJson.title,recipeJson.description)
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





// ================================================= GENERATE RECIPE BY MOOD ================================
// Expanded mood keywords
const moodKeywords = {
    happy: {
        description: 'vibrant, colorful, and light to enhance a joyful mood',
        cuisine: 'Mediterranean',
        difficulty: 'Easy',
        tags: ['Vegetarian', 'Healthy', 'Bright'],
        suggestedIngredients: ['cherry tomatoes', 'cucumber', 'feta cheese', 'lemon', 'olive oil'],
    },
    sad: {
        description: 'warm, comforting, and hearty to lift spirits',
        cuisine: 'Italian',
        difficulty: 'Medium',
        tags: ['Comfort Food', 'Hearty'],
        suggestedIngredients: ['pasta', 'cheese', 'cream', 'chocolate', 'garlic'],
    },
    stressed: {
        description: 'quick, easy, and low-effort to reduce tension',
        cuisine: 'Any',
        difficulty: 'Easy',
        tags: ['Quick', 'Low Effort'],
        suggestedIngredients: ['pre-cooked rice', 'canned beans', 'spinach', 'avocado', 'eggs'],
    },
    pressures: {
        description: 'quick, soothing, and calming to ease a busy mind',
        cuisine: 'Any',
        difficulty: 'Easy',
        tags: ['Quick', 'Calming'],
        suggestedIngredients: ['chamomile', 'honey', 'oats', 'almonds', 'yogurt'],
    },
    celebratory: {
        description: 'indulgent, decadent, and festive for special occasions',
        cuisine: 'French',
        difficulty: 'Hard',
        tags: ['Indulgent', 'Festive'],
        suggestedIngredients: ['butter', 'cream', 'chocolate', 'wine', 'truffle'],
    },
    tired: {
        description: 'simple, energizing, and nutrient-packed to boost energy',
        cuisine: 'Any',
        difficulty: 'Easy',
        tags: ['Quick', 'Energizing', 'Healthy'],
        suggestedIngredients: ['bananas', 'peanut butter', 'whole grains', 'berries', 'nuts'],
    },
    anxious: {
        description: 'calming, gentle, and easy to digest to soothe nerves',
        cuisine: 'Any',
        difficulty: 'Easy',
        tags: ['Calming', 'Light'],
        suggestedIngredients: ['herbal tea', 'ginger', 'rice', 'chicken', 'mint'],
    },
    nostalgic: {
        description: 'homestyle, familiar, and reminiscent of childhood',
        cuisine: 'American',
        difficulty: 'Medium',
        tags: ['Comfort Food', 'Traditional'],
        suggestedIngredients: ['macaroni', 'cheese', 'ground beef', 'apples', 'cinnamon'],
    },
    excited: {
        description: 'bold, flavorful, and adventurous to match high energy',
        cuisine: 'Mexican',
        difficulty: 'Medium',
        tags: ['Spicy', 'Bold'],
        suggestedIngredients: ['chili peppers', 'lime', 'cilantro', 'corn', 'black beans'],
    },
    calm: {
        description: 'balanced, light, and harmonious to maintain tranquility',
        cuisine: 'Japanese',
        difficulty: 'Easy',
        tags: ['Light', 'Healthy'],
        suggestedIngredients: ['tofu', 'miso', 'seaweed', 'rice', 'green tea'],
    },
    angry: {
        description: 'spicy, bold, and satisfying to channel intense emotions',
        cuisine: 'Thai',
        difficulty: 'Medium',
        tags: ['Spicy', 'Bold'],
        suggestedIngredients: ['chili', 'coconut milk', 'basil', 'fish sauce', 'lemongrass'],
    },
    bored: {
        description: 'unique, creative, and engaging to spark interest',
        cuisine: 'Fusion',
        difficulty: 'Medium',
        tags: ['Creative', 'Unique'],
        suggestedIngredients: ['quinoa', 'pomegranate', 'edamame', 'sriracha', 'mango'],
    },
    lonely: {
        description: 'cozy, comforting, and single-serving to feel nurtured',
        cuisine: 'Any',
        difficulty: 'Easy',
        tags: ['Comfort Food', 'Single Serving'],
        suggestedIngredients: ['bread', 'butter', 'soup', 'cheese', 'herbs'],
    },
    inspired: {
        description: 'artistic, sophisticated, and visually appealing to fuel creativity',
        cuisine: 'International',
        difficulty: 'Hard',
        tags: ['Gourmet', 'Artistic'],
        suggestedIngredients: ['saffron', 'asparagus', 'salmon', 'balsamic vinegar', 'microgreens'],
    },
};

// Mood analysis function
function analyzeMood(mood) {
    const normalizedMood = mood.toLowerCase().trim();
    let style = {
        description: 'versatile, balanced dish suitable for any mood',
        cuisine: 'International',
        difficulty: 'Medium',
        dietaryTags: ['None'],
        suggestedIngredients: ['chicken', 'rice', 'vegetables', 'olive oil'],
    };

    // Combine styles for detected moods
    let matchedMoods = [];
    Object.keys(moodKeywords).forEach((key) => {
        if (normalizedMood.includes(key)) {
            matchedMoods.push(key);
            style.description += `, ${moodKeywords[key].description}`;
            style.cuisine = moodKeywords[key].cuisine !== 'Any' ? moodKeywords[key].cuisine : style.cuisine;
            style.difficulty = moodKeywords[key].difficulty === 'Easy' ? 'Easy' : style.difficulty;
            style.dietaryTags.push(...moodKeywords[key].tags);
            style.suggestedIngredients.push(...moodKeywords[key].suggestedIngredients);
        }
    });

    // Remove duplicates
    style.dietaryTags = [...new Set(style.dietaryTags)];
    style.suggestedIngredients = [...new Set(style.suggestedIngredients)];

    // Adjust for mixed moods (e.g., "happy but pressures")
    if (matchedMoods.includes('happy') && (matchedMoods.includes('stressed') || matchedMoods.includes('pressures'))) {
        style.description = 'vibrant yet quick and soothing to balance joy and stress';
        style.difficulty = 'Easy';
        style.dietaryTags = [...new Set([...style.dietaryTags, 'Quick', 'Healthy'])];
    }

    // Fallback if no specific mood detected
    if (!matchedMoods.length) {
        style.dietaryTags = ['None'];
    }

    return style;
}

export async function generateRecipeByMood(mood) {
    // Validate mood
    if (!mood || typeof mood !== 'string' || mood.trim().length === 0) {
        throw new Error('Mood is required and must be a non-empty string.');
    }

    const style = analyzeMood(mood);

    // Construct Markdown prompt to match parseMarkdownToJson expectations
    const prompt = `
      Generate a recipe tailored to the user's mood: "${mood}". The dish should be ${style.description}, suitable for ${style.cuisine} cuisine, with a ${style.difficulty} difficulty level. Use ingredients like ${style.suggestedIngredients.join(', ')} to align with the mood.
      Return the recipe in Markdown format with the following structure:
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
      Ensure the JSON parsed from this Markdown uses lowercase for preptime, cooktime, totaltime, and dietaryTags as an array. Make the recipe creative and mood-appropriate.
    `;

    try {
        const result = await model.generateContent(prompt);
        const markdownText = result.response.text().trim();

        if (!markdownText) {
            throw new Error('No recipe generated by Gemini API');
        }

        // Parse markdown to JSON
        const recipeJson = await parseMarkdownToJson(markdownText);
        return { recipeJson, recipeMarkdown: markdownText };
    } catch (error) {
        console.error('Error generating recipe:', error.message);
        throw new Error(`Failed to generate recipe: ${error.message}`);
    }
}
