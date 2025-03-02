import slugify from "slugify";
import { uploadFile } from "../../utils/cloudinary.utils.js";
import Recipe from "../../../DB/models/recipe.model.js";
import Country from './../../../DB/models/country.model.js';
import Category from './../../../DB/models/category.model.js';
import { nanoid } from "nanoid";
import Ingredient from './../../../DB/models/ingredient.model.js';
import axios from "axios";
import chalk from "chalk";
import { ApiFeatures } from "../../utils/api-features.js";





export const addRecipe=async (req,res,next)=>{
    const {name,description,ingredients,directions,videoLink,tags}=req.body;
    const {category,country}=req.query;
    const user=req.user;

    const URLs=[];
    const slug=slugify(name, {
                replacement: "_",
                lower: true,
            });

    
    if(!req.files.length){
        return next(new Error('Please upload an image',{cause:400}));
    }

    const isRecipeExists=await Recipe.findOne({slug:slug});
    if(isRecipeExists){
        return next(new Error('Recipe already exists',{cause:409}));
    }

    const isCountryExists=await Country.findById(country)
    if(!isCountryExists){
        return next(new Error('Country not found',{cause:404}));
    }
    const isCategoryExists= await Category.findById(category)
    if(!isCategoryExists){
        return next(new Error('category not found',{cause:404}));
    }
    for(let x of ingredients){
        const isingreidentExists=await Ingredient.findById(x.ingredient)
        if(!isingreidentExists){
            return next(new Error('Ingredient not found',{cause:404}));
        }
    }
    const folder = `${process.env.UPLOADS_FOLDER}/Categories/${isCategoryExists.name}/Recipes`;
    for (const img of req.files){
        const {public_id,secure_url} = await uploadFile({
            file:img.path,
            folder
        })
        URLs.push({public_id,secure_url})
    }
    
    const recipeObj={
        name,
        slug,
        description,
        ingredients,
        directions,
        createdBy:user._id,
        category,
        country,
        Images:{URLs},
        tags,
        videoLink
    }
    
    // Save the recipe to the database
    const newRecipe=await Recipe.create(recipeObj);
    if(!newRecipe){
        return next(new Error('Failed to create recipe',{cause:500}));
    }
    res.status(201).json({sucess:true,message:"Recipe created successfully",recipe:newRecipe});
} 


export const addMealDBRecipes = async (req, res, next) => {
    const baseUrl = "https://www.themealdb.com/api/json/v1/1/search.php?f=";
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const ingredientApiUrl = "https://www.themealdb.com/api/json/v1/1/filter.php?i=";
    const insertedRecipes = [];
    const insertedCountries=[];
    const insertedIngredients=[];
    try {
        for (const letter of alphabet) {
            const { data } = await axios.get(`${baseUrl}${letter}`);
            if (!data.meals) continue;

            for (const meal of data.meals) {
                try {
                    const {
                        strMeal,
                        strInstructions,
                        strYoutube,
                        strTags,
                        strArea,
                        strCategory,
                        strMealThumb,
                    } = meal;

                    const slug = slugify(strMeal, { replacement: "_", lower: true });


                    const isRecipeExists = await Recipe.findOne({ slug });
                    if (isRecipeExists) {
                        console.log(`Recipe skipped: ${strMeal} (already exists)`);
                        continue;
                    }


                    const category = await Category.findOne({ name: strCategory });
                    if (!category) {
                        console.log(`Recipe skipped: ${strMeal} (Category not found: ${strCategory})`);
                        continue;
                    }


                    const country = await Country.findOne({ name: strArea });
                    if (!country) {
                        console.log(`(Country not found: ${strArea}) Adding to DB`);
                        const newCountry = await Country.create({ name: strArea});
                        insertedCountries.push(newCountry);
                    }


                    const ingredients = [];

                    for (let i = 1; i <= 20; i++) {
                        const ingredientName = meal[`strIngredient${i}`];
                        const measure = meal[`strMeasure${i}`] || "N/A";

                        if (!ingredientName || ingredientName.trim() === "") break;
                        const slug=slugify(ingredientName, { replacement: "_", lower: true })
                        let ingredient = await Ingredient.findOne({ slug });
                        if (!ingredient) {
                            const ingredientResponse = await axios.get(`${ingredientApiUrl}${encodeURIComponent(ingredientName)}`);
                            const mealsWithIngredient = ingredientResponse.data.meals;

                                if (mealsWithIngredient) {
                                    const ingredientImageUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ingredientName)}.png`;
                                    const verifyImageResponse = await axios
                                        .get(ingredientImageUrl)
                                        .catch(() => null);

                                    if (!verifyImageResponse || verifyImageResponse.status !== 200) {
                                        console.log(`Image not found for ingredient: ${ingredientName}`);
                                        continue;
                                    }

                                    // Upload image
                                    const uploadedImage = await uploadFile({
                                        file: ingredientImageUrl,
                                        folder: `${process.env.UPLOADS_FOLDER}/ingredients`,
                                    });

                                    // Generate random base price and stock
                                    const basePrice = (Math.random() * (100 - 10) + 10).toFixed(2);
                                    const stock = Math.floor(Math.random() * (500 - 50) + 50);

                                    // Create ingredient
                                    const ingredientData = {
                                        name: ingredientName,
                                        slug,
                                        basePrice: parseFloat(basePrice),
                                        appliedPrice: parseFloat(basePrice),
                                        stock: stock,
                                        image: {
                                            public_id: uploadedImage.public_id,
                                            secure_url: uploadedImage.secure_url,
                                        },
                                        createdBy: req.user._id,
                                    };

                                    ingredient = await Ingredient.create(ingredientData);
                                    console.log(`Ingredient added: ${ingredientName}`);

                                    insertedIngredients.push(ingredient);
                            } else {
                                console.log(`${ingredientName} failed to find `)
                            }
                        }

                        ingredients.push({
                            ingredient: ingredient._id,
                            amount: measure, 
                        });
                    }


                    let image = {};
                    if (strMealThumb) {
                        const uploadedImage = await uploadFile({
                            file: strMealThumb,
                            folder: `${process.env.UPLOADS_FOLDER}/Categories/${category.name}/Recipes`,
                        });

                        image = {
                            public_id: uploadedImage.public_id,
                            secure_url: uploadedImage.secure_url,
                        };
                    } else {
                        console.log(`Recipe skipped: ${strMeal} (Image not found)`);
                        continue;
                    }


                    const recipeObj = {
                        name: strMeal,
                        slug,
                        description: strInstructions,
                        ingredients,
                        directions: strInstructions,
                        createdBy: req.user._id,
                        category: category._id,
                        country: country._id,
                        Images: {URLs: [image]},
                        tags: strTags ? strTags.split(",") : [],
                        videoLink: strYoutube || null,
                    };


                    const newRecipe = await Recipe.create(recipeObj);
                    insertedRecipes.push(newRecipe);
                    console.log(chalk.bgGreen(`Recipe added: ${strMeal}`));
                } catch (error) {
                    console.log(`Error adding recipe: ${meal.strMeal}`, error.message);
                    continue;
                }
            }
        }

        res.status(201).json({
            success: true,
            message: `${insertedRecipes.length} recipes inserted successfully`,
            insertedRecipes,
            insertedCountries,
            insertedIngredients,
        });
    } catch (error) {
        next(error);
    }
};



export const updateRecipe=async(req,res,next)=>{
    const {recipeID}=req.params
    const {name,description,directions,tags,videoLink}=req.body
    const recipe=await Recipe.findById(recipeID)
    if(!recipe) return next(new Error('Recipe not found',{cause:404}))
    if(name) {
        recipe.name=name
        recipe.slug=slugify(name, { replacement: "_", lower: true })
    }
    if(description) recipe.description=description
    if(directions) recipe.directions=directions
    if(tags) recipe.tags=tags
    if(videoLink) recipe.videoLink=videoLink
    await recipe.save()
    res.status(200).json({message:"Recipe updated successfully",recipe})
}


export const getRecipes=async(req,res,next)=>{
    const apiFeatures = new ApiFeatures(Recipe, req.query)
            .filter()
            .search()
            .sort()
            .limitFields("-createdAt -updatedAt -Images.URLs.public_id -Images.URLs._id -Images.customID -slug -ingredients._id -__v")
            .populate(
                [{
                    path:"country",
                    select:"name"
                },
                {
                    path:"category",
                    select:"name"
                },
                {
                    path:"ingredients.ingredient",
                    select:"name image.secure_url _id basePrice appliedPrice stock Average_rating discount"
                },
            {
                path:"createdBy",
                select:"username profileImage.secure_url -_id"
            }]
            )
            .paginate();

        const recipes = await apiFeatures.execute();

        res.status(200).json({
            success: true,
            recipes
        });
    }

export const viewRecipe=async(req,res,next)=>{
    const {recipeID}=req.params
    const recipe=await Recipe.findByIdAndUpdate(recipeID, { $inc: { views: 1 } }, { new: true });
    if(!recipe) return next(new Error('Recipe not found',{cause:404}))
    res.status(200).json({message:"Recipe viewed successfully"})
}
