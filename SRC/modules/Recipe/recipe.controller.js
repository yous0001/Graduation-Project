import slugify from "slugify";
import { uploadFile } from "../../utils/cloudinary.utils.js";
import Recipe from "../../../DB/models/recipe.model.js";
import Country from './../../../DB/models/country.model.js';
import Category from './../../../DB/models/category.model.js';
import { nanoid } from "nanoid";
import Ingredient from './../../../DB/models/ingredient.model.js';



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
    const customID=nanoid(6)
    const folder=`${process.env.UPLOADS_FOLDER}/Categories/${isCategoryExists.name}/Recipes/${customID}` 
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
        Images:{
            URLs,
            customID
        },
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