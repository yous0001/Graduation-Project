import axios from 'axios';
import { uploadFile, uploadFileBuffer } from '../../utils/cloudinary.utils.js';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { marked } from 'marked';
import { parse } from 'node-html-parser';
import { validGoals } from '../../utils/enums.utils.js';
import aiConfig from '../Ai/options/ai.config.js';
import validationConfig from './options/validation.config.js';

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
      aiConfig.endpoints.huggingFace.recipeGeneration,
      {
        inputs: ingredients + "note: give me most similar recipe without error please",
        parameters: {
          max_length: 50000,
          do_sample: true,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN2}`,
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
      aiConfig.endpoints.huggingFace.dutRecipeGenerator,
      {
        inputs: `Ingredients: ${ingredients}. Generate a healthy recipe.`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN2}`,
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
      aiConfig.endpoints.huggingFace.gpt2,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN2}`,
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
      aiConfig.endpoints.openai.imageGeneration,
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
  const API_URL = aiConfig.endpoints.huggingFace.stableDiffusion;
  const headers = {
    'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN2}`,
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
    return aiConfig.defaults.placeholderImage;
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


export async function generateImageForGemini(recipeJson, retries = 2) {
    const API_URL = aiConfig.endpoints.huggingFace.flux;
    const acceptTypes = ['image/png', 'image/jpeg'];
    // Array of API keys from HUGGINGFACE_TOKEN1 to HUGGINGFACE_TOKEN10
    const apiKeys = Array.from({ length: aiConfig.limits.maxHuggingFaceKeys }, (_, i) => process.env[`HUGGINGFACE_TOKEN${i + 1}`]).filter(Boolean);
    let lastError = null;

    // Validate that at least one API key is available
    if (apiKeys.length === 0) {
        console.error('No Hugging Face API keys found in environment variables.');
        return aiConfig.defaults.placeholderImage;
    }

    // Log input for debugging
    console.log('Recipe:', { title: recipeJson.title, description: recipeJson.description });

    // Original prompt (unchanged)
    const prompt = `
        A beautifully plated dish of ${recipeJson.title.toLowerCase()}, showcasing ${recipeJson.description.split('.')[0].toLowerCase()}. 
        The presentation is vibrant, appetizing, and professionally styled, with garnishes and a clean, modern background. 
        Emphasize rich colors, fresh ingredients, and a delicious, inviting look. 
        One high-quality image for a recipe display.
    `;

    const data = {
        inputs: prompt,
    };

    // Try each API key
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        const apiKey = apiKeys[keyIndex];
        console.log(`Using API key ${keyIndex + 1} of ${apiKeys.length}`);

        // Try each accept type
        for (let acceptIndex = 0; acceptIndex < retries; acceptIndex++) {
            const headers = {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                Accept: acceptTypes[acceptIndex],
            };

            // Retry for sleeping model (up to 3 attempts)
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    // Call Hugging Face Stable Diffusion API
                    const response = await axios.post(API_URL, data, {
                        headers,
                        responseType: 'arraybuffer',
                    });

                    // Log response status for debugging
                    console.log('Hugging Face API response:', {
                        status: response.status,
                        contentType: response.headers['content-type'],
                    });

                    // The response.data is already a Buffer
                    const imageBuffer = response.data;

                    // Upload the buffer to Cloudinary
                    const uploadResult = await uploadFileBuffer({
                        buffer: imageBuffer,
                        filename: `${recipeJson.title.replace(/\s+/g, '_').toLowerCase()}.${acceptTypes[acceptIndex].split('/')[1]}`,
                        folder: `${process.env.UPLOADS_FOLDER}/chat-recipes`,
                    });

                    return uploadResult.secure_url;
                } catch (error) {
                    console.error(`❌ Attempt ${attempt + 1} with Accept: ${acceptTypes[acceptIndex]} and API key ${keyIndex + 1} failed:`, error.message);
                    lastError = error; // Fixed typo here

                    let errorMessage = null;
                    if (error.response?.data instanceof Buffer) {
                        try {
                            errorMessage = JSON.parse(Buffer.from(error.response.data).toString('utf-8'));
                            console.error('Hugging Face API error:', errorMessage);
                        } catch (parseError) {
                            console.error('Failed to parse error response:', parseError.message);
                        }
                    }

                    // Handle rate limit (429) by breaking to try the next API key
                    if (error.response?.status === 429) {
                        console.log(`Rate limit exceeded for API key ${keyIndex + 1}. Trying next key...`);
                        break; // Exit the attempt loop and try the next API key
                    }

                    // Handle model sleeping or loading errors
                    if (
                        error.response?.status === 504 ||
                        errorMessage?.error?.includes('model is currently loading') ||
                        errorMessage?.error?.includes('sleeping')
                    ) {
                        console.log(`Model may be sleeping or rate-limited dermal. Retrying after ${attempt + 1}s...`);
                        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
                        continue;
                    }

                    // Other errors: break to try the next accept type
                    break;
                }
            }

            // If we broke out due to a 429, skip to the next API key
            if (lastError?.response?.status === 429) {
                break;
            }
        }

        // Log if all retries for this API key failed
        if (keyIndex === apiKeys.length - 1) {
            console.error('All API keys and retries exhausted.');
        }
    }

    // Return placeholder URL on failure
    console.error('Final error:', lastError?.message || 'Unknown error');
    return aiConfig.defaults.placeholderImage;
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

async function parseDietPlanMarkdown(markdownText) {
  const html = await marked(markdownText);
  const root = parse(html);

  // Log HTML for debugging
  console.log('Parsed HTML:', html.substring(0, 1000) + (html.length > 1000 ? '...' : ''));

  const days = [];
  const dayNodes = root.querySelectorAll('h2');

  for (const dayNode of dayNodes) {
    if (!dayNode.textContent.startsWith('Day')) continue;

    const dayNumber = parseInt(dayNode.textContent.replace('Day', '').trim());
    const meals = {};

    // Find all h3 nodes following the h2 until the next h2
    let currentNode = dayNode.nextElementSibling;
    const mealNodes = [];
    while (currentNode && currentNode.tagName !== 'H2') {
      if (currentNode.tagName === 'H3') {
        mealNodes.push(currentNode);
      }
      currentNode = currentNode.nextElementSibling;
    }

    for (const mealNode of mealNodes) {
      const mealType = mealNode.textContent.toLowerCase().replace(/\s+/g, '').replace(/\(\d+kcal\)/, '');
      let recipeNode = mealNode.nextElementSibling;

      // Collect all sibling nodes until the next h3 or h2
      const recipeContent = [];
      while (recipeNode && recipeNode.tagName !== 'H3' && recipeNode.tagName !== 'H2') {
        recipeContent.push(recipeNode);
        recipeNode = recipeNode.nextElementSibling;
      }

      // Extract recipe details
      const titleNode = recipeContent.find(node => node.tagName === 'H4');
      const title = titleNode?.textContent || '';

      // Find the top-level <ul> containing sections
      const sectionsList = recipeContent.find(node => node.tagName === 'UL');
      const sectionItems = sectionsList?.querySelectorAll('li') || [];

      // Description
      const descriptionItem = sectionItems.find(item => item.textContent.toLowerCase().includes('description'));
      const description = descriptionItem?.querySelector('p')?.textContent.replace(/.*[Dd]escription.*?:\s*/, '').trim() || '';

      // Ingredients
      const ingredientsItem = sectionItems.find(item => item.textContent.toLowerCase().includes('ingredients'));
      const ingredients = ingredientsItem?.querySelector('ul')
        ? Array.from(ingredientsItem.querySelectorAll('ul > li')).map(item => {
          const text = item.textContent.trim();
          const match = text.match(/^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞]+)?\s*([a-zA-Z\s]+?)(?:\s*\((.*?)\))?$/);
          return {
            quantity: match?.[1]?.trim() || '',
            name: match?.[2]?.trim() || text,
            substitute: match?.[3]?.includes('substitute') ? match[3].replace(/.*substitute:\s*/, '').trim() : undefined,
            notes: match?.[3] && !match[3].includes('substitute') ? match[3].trim() : undefined,
          };
        })
        : [];

      // Instructions
      const instructionsItem = sectionItems.find(item => item.textContent.toLowerCase().includes('instructions'));
      const instructions = instructionsItem?.querySelector('ol')
        ? Array.from(instructionsItem.querySelectorAll('ol > li')).map((item, index) => {
          const text = item.textContent.trim();
          const [action, ...desc] = text.split(': ');
          return {
            step: index + 1,
            action: action.replace(/\*\*/g, '').trim(),
            description: desc.join(': ').trim(),
          };
        })
        : [];

      // Nutritional Information
      const nutritionItem = sectionItems.find(item => item.textContent.toLowerCase().includes('nutritional information'));
      const nutrition = {};
      if (nutritionItem?.querySelector('ul')) {
        nutritionItem.querySelectorAll('ul > li').forEach(item => {
          const [key, value] = item.textContent.split(': ').map(s => s.trim());
          if (key.toLowerCase() !== 'note') {
            nutrition[key.toLowerCase()] = value;
          } else {
            nutrition.note = value;
          }
        });
      }

      // Dietary Tags
      const tagsItem = sectionItems.find(item => item.textContent.toLowerCase().includes('dietary tags'));
      const dietaryTags = tagsItem?.querySelector('p')
        ?.textContent.split(',').map(tag => tag.trim()).filter(tag => tag && !tag.includes('Note:')) || [];

      // Log parsed meal for debugging
      console.log(`Parsed meal ${mealType} for Day ${dayNumber}:`, { title, description, ingredients, instructions, nutrition, dietaryTags });

      meals[mealType] = {
        title,
        description,
        ingredients,
        instructions,
        nutrition,
        dietaryTags,
      };
    }

    days.push({ day: dayNumber, meals });
  }

  return { days };
}

export async function generateDietPlan({ height, age, weight, fatPercentage, goal, preferences, gender }) {
  // Input validation
  if (!height || !age || !weight || !fatPercentage || !goal || !preferences || !gender) {
    throw new Error('All fields (height, age, weight, fatPercentage, goal, preferences, gender) are required');
  }
  if (typeof height !== 'number' || height < 100 || height > 250) {
    throw new Error('Height must be a number between 100 and 250 cm');
  }
  if (typeof age !== 'number' || age < 18 || age > 100) {
    throw new Error('Age must be a number between 18 and 100 years');
  }
  if (typeof weight !== 'number' || weight < 30 || weight > 200) {
    throw new Error('Weight must be a number between 30 and 200 kg');
  }
  if (typeof fatPercentage !== 'number' || fatPercentage < 5 || fatPercentage > 50) {
    throw new Error('Fat percentage must be a number between 5 and 50%');
  }
  const theValidGoals = Object.values(validGoals);
  if (!theValidGoals.includes(goal.toLowerCase())) {
    throw new Error('Goal must be one of: weight loss, muscle gain, maintenance');
  }
  const validGenders = ['male', 'female'];
  if (!validGenders.includes(gender.toLowerCase())) {
    throw new Error('Gender must be one of: male, female');
  }

  // Calculate BMR using Mifflin-St Jeor Equation
  const isMale = gender.toLowerCase() === 'male';
  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // Estimate TDEE (moderate activity level, multiplier 1.55)
  const tdee = bmr * 1.55;

  // Adjust calories based on goal
  let dailyCalories;
  switch (goal.toLowerCase()) {
    case 'weight loss':
      dailyCalories = tdee - 500;
      break;
    case 'muscle gain':
      dailyCalories = tdee + 400;
      break;
    case 'maintenance':
      dailyCalories = tdee;
      break;
  }

  // Split calories: 25% breakfast, 30% lunch, 30% dinner, 7.5% each snack
  const calorieSplit = {
    breakfast: Math.round(dailyCalories * 0.25),
    lunch: Math.round(dailyCalories * 0.30),
    dinner: Math.round(dailyCalories * 0.30),
    snack1: Math.round(dailyCalories * 0.075),
    snack2: Math.round(dailyCalories * 0.075),
  };

  // Initialize API keys
  const maxKeys = aiConfig.limits.maxGeminiKeys; // Limit to GEMINI_API_KEY1 through GEMINI_API_KEY5
  let currentKeyIndex = 1;
  let apiKey = process.env[`GEMINI_API_KEY${currentKeyIndex}`];

  if (!apiKey) {
    throw new Error('No Gemini API key found in GEMINI_API_KEY1');
  }

  // Initialize Gemini model
  let genAI = new GoogleGenerativeAI(apiKey);
  let model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
  });

  // Generate diet plan day by day
  const dietPlan = [];
  for (let day = 1; day <= 30; day++) {
    console.log(`Generating diet plan for Day ${day} with GEMINI_API_KEY${currentKeyIndex}...`);

    // Construct prompt for a single day
    const prompt = `
      You are a professional nutritionist and chef. Create a diet plan for Day ${day} tailored to a user with:
      - Height: ${height} cm
      - Age: ${age} years
      - Weight: ${weight} kg
      - Body Fat: ${fatPercentage}%
      - Goal: ${goal}
      - Dietary Preferences: ${preferences}
      - Gender: ${gender}

      Provide 5 recipes for the day (breakfast, lunch, dinner, two snacks) with a total daily calorie intake of approximately ${Math.round(dailyCalories)} kcal, distributed as:
      - Breakfast: ${calorieSplit.breakfast} kcal
      - Lunch: ${calorieSplit.lunch} kcal
      - Dinner: ${calorieSplit.dinner} kcal
      - Snack 1: ${calorieSplit.snack1} kcal
      - Snack 2: ${calorieSplit.snack2} kcal

      Format the plan as a Markdown document with the following structure:

      ## Day ${day}
      ### Breakfast
      #### [Recipe Title]
      - **Description**: [Brief description of the dish, its flavors, and suitability]
      - **Ingredients**:
        - [Quantity] [ingredient]
      - **Instructions**:
        1. **[Action Verb]**: [Detailed step description, including preparation tips, specific cooking techniques, exact temperatures or times, sensory cues (e.g., "until golden brown"), and serving suggestions]
        2. ...
      - **Nutritional Information** (per serving):
        - Calories: [e.g., 300 kcal]
        - Protein: [e.g., 15g]
        - Fat: [e.g., 10g]
        - Carbohydrates: [e.g., 40g]
      - **Dietary Tags**: [e.g., Vegetarian, Gluten-Free]

      ### Lunch
      #### [Recipe Title]
      - **Description**: [Brief description]
      - **Ingredients**:
        - [Quantity] [ingredient]
      - **Instructions**:
        1. **[Action Verb]**: [Detailed step description]
        2. ...
      - **Nutritional Information** (per serving):
        - Calories: [e.g., 400 kcal]
        - Protein: [e.g., 20g]
        - Fat: [e.g., 15g]
        - Carbohydrates: [e.g., 50g]
      - **Dietary Tags**: [e.g., Vegetarian, Gluten-Free]

      ### Dinner
      #### [Recipe Title]
      - **Description**: [Brief description]
      - **Ingredients**:
        - [Quantity] [ingredient]
      - **Instructions**:
        1. **[Action Verb]**: [Detailed step description]
        2. ...
      - **Nutritional Information** (per serving):
        - Calories: [e.g., 400 kcal]
        - Protein: [e.g., 20g]
        - Fat: [e.g., 15g]
        - Carbohydrates: [e.g., 50g]
      - **Dietary Tags**: [e.g., Vegetarian, Gluten-Free]

      ### Snack 1
      #### [Recipe Title]
      - **Description**: [Brief description]
      - **Ingredients**:
        - [Quantity] [ingredient]
      - **Instructions**:
        1. **[Action Verb]**: [Detailed step description]
        2. ...
      - **Nutritional Information** (per serving):
        - Calories: [e.g., 100 kcal]
        - Protein: [e.g., 5g]
        - Fat: [e.g., 5g]
        - Carbohydrates: [e.g., 10g]
      - **Dietary Tags**: [e.g., Vegetarian, Gluten-Free]

      ### Snack 2
      #### [Recipe Title]
      - **Description**: [Brief description]
      - **Ingredients**:
        - [Quantity] [ingredient]
      - **Instructions**:
        1. **[Action Verb]**: [Detailed step description]
        2. ...
      - **Nutritional Information** (per serving):
        - Calories: [e.g., 100 kcal]
        - Protein: [e.g., 5g]
        - Fat: [e.g., 5g]
        - Carbohydrates: [e.g., 10g]
      - **Dietary Tags**: [e.g., Vegetarian, Gluten-Free]

      Ensure each recipe:
      - Aligns with the user's dietary preferences (${preferences}).
      - Meets the calorie targets for each meal/snack.
      - Includes 7–10 detailed, step-by-step cooking instructions that specify preparation techniques (e.g., chopping methods), cooking methods (e.g., pan type, heat level), exact times or temperatures, sensory cues (e.g., "until crispy"), and serving tips (e.g., "garnish with fresh herbs").
      - Uses consistent units (e.g., tbsp, tsp, cups).
      - Has bold action verbs in instructions.
      - Is unique compared to previous days, avoiding repeated protein sources (e.g., use chicken, fish, or tofu instead of steak if used recently).
      - Includes substitutes for uncommon ingredients where applicable.

      The plan should be error-free, creative, and optimized for the user's goal (${goal}). Do not include notes about repeating for other days or approximate calorie disclaimers.
    `;

    // Retry logic for API errors
    let dayPlan = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const markdownText = result.response.text().trim();

        if (!markdownText) {
          throw new Error(`No diet plan generated for Day ${day}`);
        }

        // Log Markdown for debugging
        console.log(`Markdown for Day ${day}:`, markdownText.substring(0, 1000));

        // Parse Markdown to JSON
        const parsedPlan = await parseDietPlanMarkdown(markdownText);
        if (parsedPlan.days.length === 0 || !parsedPlan.days[0].meals) {
          throw new Error(`Invalid diet plan for Day ${day}`);
        }

        // Validate instructions (7–10 steps)
        Object.entries(parsedPlan.days[0].meals).forEach(([mealType, recipe]) => {
          if (recipe.instructions.length < validationConfig.arrays.recipeInstructions.min) {
            console.warn(`Warning: ${mealType} for Day ${day} has only ${recipe.instructions.length} instructions`);
          }
        });

        dayPlan = parsedPlan.days[0];
        break; // Success, exit retry loop
      } catch (error) {
        console.error(`Attempt ${attempt + 1} for Day ${day} with GEMINI_API_KEY${currentKeyIndex} failed:`, error.message);

        // Check for RESOURCE_EXHAUSTED
        if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
          if (currentKeyIndex < maxKeys) {
            currentKeyIndex++;
            apiKey = process.env[`GEMINI_API_KEY${currentKeyIndex}`];
            if (!apiKey) {
              console.error(`No more API keys available after GEMINI_API_KEY${currentKeyIndex - 1}`);
              break;
            }
            console.log(`Switching to GEMINI_API_KEY${currentKeyIndex}`);
            genAI = new GoogleGenerativeAI(apiKey);
            model = genAI.getGenerativeModel({
              model: 'gemini-1.5-flash',
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              ],
            });
            attempt--; // Retry with new key without counting as an attempt
            continue;
          } else {
            console.error(`All API keys (up to GEMINI_API_KEY${maxKeys}) exhausted`);
          }
        }

        if (attempt === 2) {
          console.error(`Failed to generate Day ${day} after 3 attempts. Using placeholder.`);
          dayPlan = createPlaceholderDay(day, calorieSplit, preferences);
        } else {
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000)); // Delay before retry
        }
      }
    }

    // // Generate images for recipes (commented out as requested)
    // const mealsWithImages = await Promise.all(Object.entries(dayPlan.meals).map(async ([mealType, recipe]) => {
    //   try {
    //     const imageUrl = await generateImageForGemini({
    //       title: recipe.title,
    //       description: recipe.description,
    //     });
    //     return [mealType, { ...recipe, imageUrl }];
    //   } catch (error) {
    //     console.error(`Failed to generate image for ${mealType} on Day ${day}:`, error.message);
    //     return [mealType, { ...recipe, imageUrl: 'https://via.placeholder.com/800x400?text=Recipe+Image' }];
    //   }
    // }));

    // dietPlan.push({ day, meals: Object.fromEntries(mealsWithImages) });
    dietPlan.push({ day, meals: dayPlan.meals });
  }

  return {
    totalCalories: Math.round(dailyCalories),
    calorieSplit,
    dietPlan,
  };
}

// Helper function to create a placeholder day
function createPlaceholderDay(day, calorieSplit, preferences) {
  const tags = preferences.split(',').map(tag => tag.trim());
  return {
    day,
    meals: {
      breakfast: {
        title: 'Placeholder Breakfast',
        description: 'A simple breakfast to meet your calorie needs.',
        ingredients: [{ quantity: '1 serving', name: 'generic food item' }],
        instructions: [{ step: 1, action: 'Prepare', description: 'Prepare the food item.' }],
        nutrition: { calories: `${calorieSplit.breakfast} kcal`, protein: 'Unknown', fat: 'Unknown', carbohydrates: 'Unknown' },
        dietaryTags: tags,
      },
      lunch: {
        title: 'Placeholder Lunch',
        description: 'A simple lunch to meet your calorie needs.',
        ingredients: [{ quantity: '1 serving', name: 'generic food item' }],
        instructions: [{ step: 1, action: 'Prepare', description: 'Prepare the food item.' }],
        nutrition: { calories: `${calorieSplit.lunch} kcal`, protein: 'Unknown', fat: 'Unknown', carbohydrates: 'Unknown' },
        dietaryTags: tags,
      },
      dinner: {
        title: 'Placeholder Dinner',
        description: 'A simple dinner to meet your calorie needs.',
        ingredients: [{ quantity: '1 serving', name: 'generic food item' }],
        instructions: [{ step: 1, action: 'Prepare', description: 'Prepare the food item.' }],
        nutrition: { calories: `${calorieSplit.dinner} kcal`, protein: 'Unknown', fat: 'Unknown', carbohydrates: 'Unknown' },
        dietaryTags: tags,
      },
      snack1: {
        title: 'Placeholder Snack 1',
        description: 'A simple snack to meet your calorie needs.',
        ingredients: [{ quantity: '1 serving', name: 'generic snack item' }],
        instructions: [{ step: 1, action: 'Prepare', description: 'Prepare the snack item.' }],
        nutrition: { calories: `${calorieSplit.snack1} kcal`, protein: 'Unknown', fat: 'Unknown', carbohydrates: 'Unknown' },
        dietaryTags: tags,
      },
      snack2: {
        title: 'Placeholder Snack 2',
        description: 'A simple snack to meet your calorie needs.',
        ingredients: [{ quantity: '1 serving', name: 'generic snack item' }],
        instructions: [{ step: 1, action: 'Prepare', description: 'Prepare the snack item.' }],
        nutrition: { calories: `${calorieSplit.snack2} kcal`, protein: 'Unknown', fat: 'Unknown', carbohydrates: 'Unknown' },
        dietaryTags: tags,
      },
    },
  };
}


export async function enhanceRecipesGemini(recommendations) {
  try {
    // Array to store enhanced recipes
    const enhancedRecipes = [];

    // Iterate through each recommendation
    for (const recommendation of recommendations) {
      const { title, directions, ingredients } = recommendation;

      // Parse directions from stringified JSON array if needed
      const parsedDirections = typeof directions === 'string' ? JSON.parse(directions) : directions;

      // Format the prompt for enhancing the recipe
      const prompt = `
          You are a professional chef tasked with enhancing an existing recipe. Using the provided title, ingredients, and directions, create a detailed, polished recipe. Enhance the recipe by adding specific quantities, additional common ingredients (e.g., salt, pepper, oil, water) if needed, and detailed instructions to make it practical and flavorful. Include substitutes where applicable and ensure the recipe is clear and error-free.

          **Provided Recipe Data:**
          - **Title**: ${title}
          - **Ingredients**: ${ingredients.join(', ')}
          - **Directions**: ${parsedDirections.join(' ')} 

          **Instructions for Enhancement:**
          - Use the provided title, ingredients, and directions as a base.
          - Add specific quantities for all ingredients (e.g., 1 cup rice, 2 chicken breasts).
          - Include additional common ingredients if necessary to complete the recipe.
          - Rewrite the directions to be clear, concise, and detailed, with bold action verbs.
          - Suggest a cuisine type, difficulty level, and appropriate serving size.
          - Provide approximate nutritional information per serving.
          - Format the enhanced recipe in markdown with exactly the following structure:

          # Recipe Title

          ## Overview
          - **Cuisine**: [e.g., American, Italian]
          - **Difficulty**: [Easy, Medium, Hard]
          - **Servings**: [e.g., 4 servings]
          - **Prep Time**: [e.g., 15 minutes]
          - **Cook Time**: [e.g., 20 minutes]
          - **Total Time**: [e.g., 35 minutes]
          - **Dietary Tags**: [e.g., Gluten-Free, Dairy-Free]

          ## Description
          [Brief description of the dish, its flavors, and occasion]

          ## Ingredients
          - [Quantity] [ingredient] (e.g., 1 cup flour)
          - [Include substitutes in parentheses if applicable, e.g., (or substitute: 1 cup milk + 1 tbsp vinegar)]

          ## Instructions
          1. **[Action Verb]**: [Step description, concise and clear]
          2. ...

          ## Tips and Variations
          - [Tip or variation, e.g., Add 1 tsp paprika for extra flavor]
          - [Storage instructions, e.g., Store in fridge for 3 days]

          ## Nutritional Information (Approximate, per serving)
          - Calories: [e.g., 150 kcal]
          - Protein: [e.g., 4g]
          - Fat: [e.g., 6g]
          - Carbohydrates: [e.g., 20g]

          Ensure the recipe is practical, flavorful, and consistent with the provided data. Use consistent units (e.g., tbsp, tsp, cups) and bold action verbs in instructions.
              `;

      // Call Gemini API to generate enhanced recipe
      const result = await model.generateContent(prompt);
      const markdownText = result.response.text().trim();

      if (!markdownText) {
        throw new Error(`No enhanced recipe generated for ${title}`);
      }

      // Parse markdown to JSON (assuming parseMarkdownToJson is available)
      const recipeJson = await parseMarkdownToJson(markdownText);

      // Store enhanced recipe
      enhancedRecipes.push({
        recipeJson,
        recipeMarkdown: markdownText,
        originalTitle: title // Include original title for reference
      });
    }

    return enhancedRecipes;
  } catch (error) {
    console.error('Error enhancing recipes with Gemini:', error.message, error.response?.data || {});
    throw error;
  }
}