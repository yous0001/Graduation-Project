import axios from "axios";
import chalk from "chalk";
import fs from "fs"
import { uploadFile } from "../../utils/cloudinary.utils.js";
import path from "path"
import { fileURLToPath } from 'url';

export const getRecommendation=async(req,res,next)=>{
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
        inputs: ingredients+"note: give me most similar recipe without error please",
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
    return  generatedRecipe;
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
    prompt=prompt.split("ingredients")[0]
    console.log(prompt)
    const data = {
    inputs: prompt+" note:please make it be looks delicious as much as possible , i need one image for the output recipe"
    };

    try {
        const response = await axios.post(API_URL, data, { headers, responseType: 'arraybuffer' });
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const tempImagePath = path.join(__dirname, 'recipe_temp.png');
        fs.writeFileSync(tempImagePath, response.data);
        // 3. Upload to Cloudinary
        const uploadResult= await uploadFile({
            file:tempImagePath,
            folder:`${process.env.UPLOADS_FOLDER}/chat-recipes`
        })
        fs.unlinkSync(tempImagePath);
        return uploadResult.secure_url;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}
