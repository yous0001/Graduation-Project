import slugify from "slugify";
import Category from "../../../DB/models/category.model.js";
import { uploadFile } from "../../utils/cloudinary.utils.js";
import axios from "axios";

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

export const getAllCategories = async(req,res,next)=>{
    const categories=await Category.find()
    return res.status(200).json({sucess:true,categories})
}
export const getCategory=async(req,res,next)=>{
    const {id,name}=req.query;
    const queryFilter={}
    if(id)queryFilter._id=id
    if(name){
        queryFilter.name=slugify(name, {
            replacement: "_",
            lower: true,
        });
    }
    const category=await Category.findOne(queryFilter);
    if(!category)return next(new Error(`Category not found`,{cause:404}));
    return res.status(200).json({sucess:true,category})
}

export const addMealDB=async(req,res,next)=>{
    const user=req.user;
    const response = await axios.get("https://www.themealdb.com/api/json/v1/1/categories.php");
    for(const category of response.data.categories){
        const {strCategory,strCategoryThumb,strCategoryDescription}=category
        const slug=strCategory
        const isCategoryExists=Category.findOne({name:strCategory})
        if(isCategoryExists) continue;
        const { secure_url, public_id } = await uploadFile({
            file: strCategoryThumb,
            folder: `${process.env.UPLOADS_FOLDER}/Categories/${slug}`,
        });
        const categoryObj={
            name:slug,
            description:strCategoryDescription,
            addedBy:user._id,
            image:{
                public_id:public_id,
                secure_url:secure_url
            }
        }
        await Category.create(categoryObj);
    }
    const categoires=await Category.find()
    res.status(201).json({message:"categories added successfully",categoires});
}

export const updateCategory=async(req,res,next)=>{
    let {name,description}=req.body;
    const {id}=req.params;
    if(!name || !description)return next(new Error(`please insert the thing that you want to update`,{cause:400}));
    const category=await Category.findById(id);
    if(!category)return next(new Error(`Category not found`,{cause:404}));
    if(name){
        name=slugify(name, {
            replacement: "_",
            lower: true,
        });
        const isCategoryExists=await Category.findOne({name});
        if(isCategoryExists) return next(new Error(`Category with the same name already exists`,{cause:409}));
        category.name=name
    };
    if(description){
        category.description=description
    }
    await category.save();
    res.status(200).json({message:"category updated successfully",category})
    
}