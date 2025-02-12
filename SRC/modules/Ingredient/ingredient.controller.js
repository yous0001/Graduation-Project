
import slugify from 'slugify';
import Ingredient from '../../../DB/models/ingredient.model.js';
import { cloudinaryConfig, uploadFile } from '../../utils/cloudinary.utils.js';


export const addIngredient = async (req, res, next) => {
    const user = req.user;
    const { name, description, basePrice, price, discountAmount, discountType, stock } = req.body;

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

    const data=await cloudinaryConfig().uploader.destroy(ingredient.image.public_id)
    if(data.result!='ok')
        return next(new Error("Couldn't delete image", { cause: 400 }));
    const deleteingredient = await Ingredient.findByIdAndDelete(id);
    if (!deleteingredient) return next(new Error("Ingredient not found", { cause: 404 }));

    res.status(200).json({ success: true, message: "Ingredient deleted successfully" });
}