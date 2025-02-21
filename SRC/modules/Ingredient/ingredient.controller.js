
import slugify from 'slugify';
import Ingredient from '../../../DB/models/ingredient.model.js';
import { cloudinaryConfig, uploadFile } from '../../utils/cloudinary.utils.js';
import axios from 'axios';


export const addIngredient = async (req, res, next) => {
    const user = req.user;
    const { name, description, basePrice, discountAmount, discountType, stock } = req.body;

    // Generate slug for the ingredient name
    const slug = slugify(name, {
        replacement: "_",
        lower: true,
    });

    // Check if ingredient with the same slug already exists
    const isIngredientExists = await Ingredient.findOne({ slug });
    if (isIngredientExists) {
        return next(new Error(`Ingredient with this name already exists`, { cause: 400 }));
    }

    
    let image = {};
    if (req.file) {
        const uploadedImage = await uploadFile({
            file: req.file.path,
            folder: `${process.env.UPLOADS_FOLDER}/ingredients`,
        });
        image = {
            public_id: uploadedImage.public_id,
            secure_url: uploadedImage.secure_url,
        };
    }

    
    const ingredientData = {
        name,
        slug,
        description,
        basePrice,
        discount: {
            amount:discountAmount,
            type:discountType,
        },
        stock,
        image,
        createdBy: user._id,
    };

    
    const ingredient = await Ingredient.create(ingredientData);

    res.status(201).json({
        success: true,
        message: "Ingredient added successfully",
        ingredient
    });
}

export const deleteIngredient=async (req, res,next) => {
    const { id } = req.params;
    if (!id) return next(new Error("Please provide the ingredient id", { cause: 400 }));

    const ingredient = await Ingredient.findById(id);
    if(!ingredient)return next(new Error("ingredient not found", { cause: 404 }));

    const data=await cloudinaryConfig().uploader.destroy(ingredient.image.public_id)
    if(data.result!='ok')
        return next(new Error("Couldn't delete image", { cause: 400 }));
    const deleteingredient = await Ingredient.findByIdAndDelete(id);
    if (!deleteingredient) return next(new Error("Ingredient not found", { cause: 404 }));

    res.status(200).json({ success: true, message: "Ingredient deleted successfully" });
}

export const updateIngredient = async (req, res, next) => {
    const { name, description, basePrice, discountAmount, discountType, stock } = req.body;
    const { id } = req.params;

    const ingredient = await Ingredient.findById(id);
    if (!ingredient) return res.status(404).json({ success: false, message:"Ingredient not found"})

    if (name) {
        ingredient.name = name;
        ingredient.slug = slugify(name, {
            replacement: "_",
            lower: true,
        });
    }
    if (description) ingredient.description = description;
    if (basePrice) {
        ingredient.basePrice = basePrice;
        ingredient.appliedPrice = basePrice;
    }
    if (discountAmount && discountType) {
        if(discountType==="percentage" && discountAmount>100)return res.status(409).json({ success: false, message:"discount can't be more than 100%"})
        ingredient.discountAmount = discountAmount
        ingredient.discountType = discountType
        switch (discountType) {
            case "percentage":
                ingredient.appliedPrice = ingredient.basePrice * (1 - discountAmount / 100);
                break;
            case "fixed":
                ingredient.appliedPrice = ingredient.basePrice - discountAmount;
                break;
        }
    }
    if (stock) ingredient.stock = stock;
    ingredient.__v++
    await ingredient.save()

    res.status(200).json({ success: true, message: "Ingredient updated successfully", ingredient });
}

export const addMealDBIngredients=async(req,res,next)=>{
    try {
        
        const { data } = await axios.get("https://www.themealdb.com/api/json/v1/1/list.php?i=list");
        const ingredients = data.meals;

        if (!ingredients || ingredients.length === 0) {
            return res.status(404).json({
                message: "No ingredients found from the API",
            });
        }

        const insertedIngredients = [];

        for (const item of ingredients) {
            const { strIngredient } = item;

            
            const ingredientImageUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(strIngredient)}.png`;
            const verifyImageResponse = await axios.get(ingredientImageUrl).catch(() => null);

            if (!verifyImageResponse || verifyImageResponse.status !== 200) {
                console.log(`Image not found for ingredient: ${strIngredient}`);
                continue;
            }

            
            const uploadedImage = await uploadFile({
                file: ingredientImageUrl,
                folder: `${process.env.UPLOADS_FOLDER}/ingredients`,
            });

            
            const basePrice = (Math.random() * (100 - 10) + 10).toFixed(2); 
            const stock = Math.floor(Math.random() * (500 - 50) + 50); 

            
            const ingredientData = {
                name: strIngredient,
                slug: slugify(strIngredient, { replacement: "_", lower: true }),
                basePrice: parseFloat(basePrice),
                appliedPrice: parseFloat(basePrice),
                stock: stock,
                image: {
                    public_id: uploadedImage.public_id,
                    secure_url: uploadedImage.secure_url,
                },
                createdBy: req.user._id,
            };

            
            const newIngredient = await Ingredient.create(ingredientData);
            insertedIngredients.push(newIngredient);
        }

        
        return res.status(201).json({
            message: `${insertedIngredients.length} ingredients inserted successfully.`,
            ingredients: insertedIngredients,
        });

    } catch (error) {
        console.error("Error fetching and adding ingredients:", error);
        next(error); 
    }
}

export const getIngredients=async(req,res,next)=>{
    const {page=1,limit=10,...queryFilter}=req.query
    //rest operator on every request elements except page and limit
    const {name,slug,appliedPrice,stock}=queryFilter
    //name,slug,appliedPrice,stock
    const skip=(page-1)*limit
    let queryFilters={}
    if(name) queryFilters.name=name
    if(slug){ 
        queryFilters.slug=slugify(slug, { replacement: "_", lower: true })
    }
    if(appliedPrice)queryFilters.appliedPrice=appliedPrice
    if(stock) queryFilters.stock=stock
    //stringify the object to make replacing on it 
    queryFilters=JSON.stringify(queryFilters)
    //replace the operators with the correct mongoDB operators  (gt,gte,lt,lte,regex,ne,eq)
    queryFilters=queryFilters.replace(/gt|gte|lt|lte|regex|ne|eq/g, (element)=>`$${element}`);
    //parse the string back to an object  (to be able to use it in mongoose query)
    queryFilters=JSON.parse(queryFilters)
    const Ingredients=await Ingredient.paginate(queryFilters,{
        page,
        limit
        ,skip,
        select:"-createdAt -updatedAt -__v -image.public_id ",
        sort:{views:-1},
        populate:[{
            path:"createdBy",
            select:"username profileImage.secure_url -_id"
        }],
    })
    res.status(200).json({
        sucess:true,
        Ingredients
    })
}