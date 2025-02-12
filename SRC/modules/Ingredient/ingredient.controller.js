
import slugify from 'slugify';
import Ingredient from '../../../DB/models/ingredient.model.js';
import { cloudinaryConfig, uploadFile } from '../../utils/cloudinary.utils.js';


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


    let appliedPrice = basePrice;
    if (discountAmount && discountType) {
        if(discountType==="percentage" && discountAmount>100)return next(new Error("discount can't be more than 100%",{cause:409}))
        switch (discountType) {
            case "percentage":
                appliedPrice = basePrice * (1 - discountAmount / 100);
                break;
            case "fixed":
                appliedPrice = basePrice - discountAmount;
                break;
        }
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
        appliedPrice,
        discount: {
            discountAmount,
            discountType,
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