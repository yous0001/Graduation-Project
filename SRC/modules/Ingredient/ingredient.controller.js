
import slugify from 'slugify';
import Ingredient from '../../../DB/models/ingredient.model.js';
import { cloudinaryConfig, uploadFile } from '../../utils/cloudinary.utils.js';
import axios from 'axios';
import { ApiFeatures } from '../../utils/api-features.js';
import chalk from "chalk";
import { discountTypes } from '../../utils/enums.utils.js';
import Cart from '../../../DB/models/cart.model.js';

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

export const addMealDBIngredients = async (req, res, next) => {
        try {
        console.log(chalk.cyan("Fetching ingredients from MealDB API..."));

        const { data: { meals: ingredients } } = await axios.get("https://www.themealdb.com/api/json/v1/1/list.php?i=list");
    
        if (!ingredients?.length) {
            console.log(chalk.yellow("No ingredients found from the API."));
            return res.status(404).json({ message: "No ingredients found from the API" });
        }
    
        const insertedIngredients = [];
    
        for (const { strIngredient, strDescription } of ingredients) {

            const slug = slugify(strIngredient, { replacement: "_", lower: true });
            const existingIngredient = await Ingredient.findOne({ slug });
            if (existingIngredient) {
                console.log(chalk.yellow(`Skipping: Ingredient already exists: ${strIngredient}`));
                continue;
            }

            const ingredientImageUrl = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(strIngredient)}.png`;
    
            const verifyImageResponse = await axios.get(ingredientImageUrl).catch(() => null);
            if (!verifyImageResponse || verifyImageResponse.status !== 200) {
            console.log(chalk.yellow(`Skipping: Image not found for ingredient: ${strIngredient}`));
            continue;
            }
    
            console.log(chalk.cyan(`Processing ingredient: ${strIngredient}`));
    
            const uploadedImage = await uploadFile({
            file: ingredientImageUrl,
            folder: `${process.env.UPLOADS_FOLDER}/ingredients`,
            });
    
            const basePrice = Math.floor(Math.random() * 90 + 10);
            const stock = Math.floor(Math.random() * 450 + 50);

            const randomDiscount = Math.floor(Math.random() * 20);
            const discountAmount = randomDiscount < 4 ? 0 : randomDiscount;

            const ingredientData = {
            name: strIngredient,
            slug,
            basePrice,
            description: strDescription,
            stock,
            image: {
                public_id: uploadedImage.public_id,
                secure_url: uploadedImage.secure_url,
            },
            discount: {
                type: discountTypes.percentage, 
                amount: discountAmount, 
            },
            createdBy: req.user._id,
            };
    
            const newIngredient = await Ingredient.create(ingredientData);
            insertedIngredients.push(newIngredient);
    
            console.log(chalk.green(`Successfully added: ${strIngredient}`));
        }
    
        console.log(chalk.green.bold(`${insertedIngredients.length} ingredients inserted successfully.`));
    
        return res.status(201).json({
            message: `${insertedIngredients.length} ingredients inserted successfully.`,
            ingredients: insertedIngredients,
        });
        } catch (error) {
        console.error(chalk.red("Error fetching and adding ingredients:"), error);
        next(error);
        }
};

export const getIngredients=async(req,res,next)=>{
    const user=req.user;
    const apiFeatures = new ApiFeatures(Ingredient, req.query)
    .filter()
    .search()
    .sort()
    .limitFields("-createdAt -updatedAt -__v -image.public_id")
    .populate(
        [{
            path:"createdBy",
            select:"username profileImage.secure_url -_id"
        }]
    )
    .paginate();

const ingredients = await apiFeatures.execute();
const cart=await Cart.findOne({userID:user._id})
if(!cart){
    ingredients.docs = ingredients.docs.map(ing => {
        const ingObj = ing.toObject();
        ingObj.inCart = false;
        return ingObj;
    });
    return res.status(200).json({
        success: true,
        ingredients
    });
}
const ingredientIDsInCart = new Set(
    cart.ingredients.map(item => item.IngredientID.toString())
);

for (let i = 0; i < ingredients.docs.length; i++) {
    let ingObj = ingredients.docs[i].toObject();
    ingObj.inCart = ingredientIDsInCart.has(ingObj._id.toString());
    ingredients.docs[i] = ingObj;
}

res.status(200).json({
    success: true,
    ingredients
});
}

export const getSpecificIngredient=async(req,res,next)=>{
    const {name,slug}=req.query;

    const SearchQuery={};
    if(name)SearchQuery.name=name;
    if(slug)SearchQuery.slug=slug;
    const ingredient=await Ingredient.findOne(SearchQuery).populate(
        [{
            path:"createdBy",
            select:"username profileImage.secure_url -_id"
        }]
    );

    if(!ingredient) return next(new Error("Ingredient not found", {cause:404}));

    res.status(200).json({success:true,ingredient});
}