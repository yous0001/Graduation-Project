import slugify from "slugify";
import { uploadFile } from "../../utils/cloudinary.utils.js";
import Recipe from "../../../DB/models/recipe.model.js";
import Country from './../../../DB/models/country.model.js';
import Category from './../../../DB/models/category.model.js';
import Ingredient from './../../../DB/models/ingredient.model.js';
import axios from "axios";
import chalk from "chalk";
import { ApiFeatures } from "../../utils/api-features.js";
import apiConfig from '../Services/options/api.config.js';





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
    for(const x of ingredients){
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
    res.status(201).json({success:true,message:"Recipe created successfully",recipe:newRecipe});
} 


import { scrapeRecipes } from "../../utils/mealdb-scraper.js";

export const addMealDBRecipes = async (req, res, next) => {
    try {
        const { insertedRecipes, insertedCountries, insertedIngredients } = await scrapeRecipes({
            userId: req.user?._id,
        });

        res.status(201).json({
            success: true,
            message: `${insertedRecipes.length} recipes & ${insertedCountries.length} countries & ${insertedIngredients.length} ingredients inserted successfully.`,
            insertedRecipes,
            insertedCountries,
            insertedIngredients,
        });
    } catch (error) {
        next(error);
    }
};



export const updateRecipe=async(req,res,_next)=>{
    const {recipeID}=req.params
    const {name,description,directions,tags,videoLink}=req.body
    const user = req.user;
    
    const recipe=await Recipe.findById(recipeID)
    if(!recipe) return _next(new Error('Recipe not found',{cause:404}))
    
    if(name) {
        recipe.name=name
        recipe.slug=slugify(name, { replacement: "_", lower: true })
    }
    if(description) recipe.description=description
    if(directions) recipe.directions=directions
    if(tags) recipe.tags=tags
    if(videoLink) recipe.videoLink=videoLink
    
    recipe.updatedBy = user._id;
    await recipe.save()
    
    res.status(200).json({success:true,message:"Recipe updated successfully",recipe})
}


export const getRecipes=async(req,res,_next)=>{
    const user=req.user;
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
                path:"createdBy",
                select:"username profileImage.secure_url -_id"
            }]
            )
            .paginate();

        const recipes = await apiFeatures.execute();
        if(!user) return res.status(200).json({success:true,recipes})
        
        const favSet = new Set((user.favoriteRecipes || []).map((id) => id.toString()));
        for (let i = 0; i < recipes.docs.length; i++) {
            const doc = recipes.docs[i];
            const recipeObj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
            recipeObj.isFavourite = favSet.has(recipeObj._id.toString());
            recipes.docs[i] = recipeObj;
        }
        res.status(200).json({
            success: true,
            recipes
        });
    }

export const viewRecipe=async(req,res,_next)=>{
    const {recipeID}=req.params
    const recipe=await Recipe.findByIdAndUpdate(recipeID, { $inc: { views: 1 } }, { new: true });
    if(!recipe) return _next(new Error('Recipe not found',{cause:404}))
    res.status(200).json({success:true,message:"Recipe viewed successfully",recipe})
}

export const getSpecificRecipe=async(req,res,_next)=>{
    const {name,slug}=req.query
    if(!name && !slug) return _next(new Error('Please provide name or slug',{cause:400}))
    const searchObj={}
    if(name) searchObj.name=name
    if(slug) searchObj.slug=slug

    const recipe=await Recipe.findOneAndUpdate(searchObj, { $inc: { views: 1 } }, { new: true })
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
            );
    if(!recipe) return _next(new Error('Recipe not found',{cause:404}))
    res.status(200).json({success:true,message:"Recipe found successfully",recipe})
}