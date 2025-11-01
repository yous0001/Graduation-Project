import slugify from "slugify";
import Category from "../../../DB/models/category.model.js";
import { cloudinaryConfig, uploadFile } from "../../utils/cloudinary.utils.js";
import axios from "axios";
import apiConfig from "../Services/options/api.config.js";

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
    return res.status(201).json({success:true,message:"category created successfully",category})
}

export const getAllCategories = async(req,res,next)=>{
    const categories=await Category.find()
    return res.status(200).json({success:true,categories})
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
    return res.status(200).json({success:true,category})
}

export const addMealDB=async(req,res,next)=>{
    const user=req.user;
    const response = await axios.get(`${apiConfig.mealDB.baseUrl}${apiConfig.mealDB.endpoints.categories}`);
    const insertedCategories=[]
    for(const category of response.data.categories){
        const {strCategory,strCategoryThumb,strCategoryDescription}=category
        const slug=slugify(strCategory,{replacement: "_",lower: true})
        const isCategoryExists=await Category.findOne({name:slug})
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
        const newCategory=await Category.create(categoryObj);
        insertedCategories.push(newCategory);
    }
    if(insertedCategories.length==0)return res.status(200).json({success:true,message:"no new categories to be added"})
    res.status(201).json({success:true,message:"categories added successfully",insertedCategories});
}

export const updateCategory=async(req,res,next)=>{
    let {description}=req.body;
    const {id}=req.params;
    if(!req.file && !description)return next(new Error(`please insert the thing that you want to update`,{cause:400}));
    const category=await Category.findById(id);
    if(!category)return next(new Error(`Category not found`,{cause:404}));
    if(description){
        category.description=description
    }
    if(req.file){
        const { secure_url } = await cloudinaryConfig().uploader.upload(req.file.path,{
            folder: `${process.env.UPLOADS_FOLDER}/Categories/${category.name}`,
            public_id:category.image.public_id,
            overwrite: true,
            resource_type:"image"
        })
        category.image.secure_url=secure_url
    }
    if (req.user && req.user._id) {
        category.updatedBy = req.user._id;
    }
    await category.save();
    res.status(200).json({success:true,message:"category updated successfully",category})
    
}