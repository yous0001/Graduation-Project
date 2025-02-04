import slugify from "slugify";
import Category from "../../../DB/models/category.model.js";
import { uploadFile } from "../../utils/cloudinary.utils.js";

export const createCategory = async(req,res,next)=>{
    const user=req.user;
    const {name,description}=req.body;

    const slug = slugify(name, {
        replacement: "_",
        lower: true,
    });
    if (!req.file) {
            return next(
            new Error("Please upload an image", 400, "Please upload an image")
            );
        }
        
        const { secure_url, public_id } = await uploadFile({
            file: req.file.path,
            folder: `${process.env.UPLOADS_FOLDER}/Categories/${slug}`,
        });
    const categoryObj={
        name:slug,
        description,
        addedBy:user._id,
        image:{
            public_id:public_id,
            secure_url:secure_url
        }
    }
    const category=await  Category.create(categoryObj);
    return res.status(201).json({sucess:true,message:"category created successfully",category})
}