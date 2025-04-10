import Banner from "../../../DB/models/banner.model.js";
import { cloudinaryConfig, uploadFile } from "../../utils/cloudinary.utils.js";

export const addBanner=async(req,res,next)=>{
    const {section}=req.body;
    const user = req.user;

    if(!section)
        return next(new Error('Please select a section',{cause:400}));

    const isBannerExists= await Banner.findOne({ section });
    if (isBannerExists) {
        return res.status(404).json({ message: "section is already have banner please select another section or update the banner" });
    }

    if(!req.files.length){
        return next(new Error('Please upload an image',{cause:400}));
    }
    const Images=[]
    const folder = `${process.env.UPLOADS_FOLDER}/banners/${section}`;
    for (const img of req.files){
        const {public_id,secure_url} = await uploadFile({
            file:img.path,
            folder
        })
        Images.push({public_id,secure_url})
    }

    const banner=await Banner.create({section,Images,addedBy:user._id})
    return res.status(200).json({sucess:true,banner})
}

export const deleteBanner=async(req,res,next)=>{
    const {id}=req.params;
    if(!id)
        return next(new Error('Please provide banner id',{cause:400}));
    const isBannerExists= await Banner.findById(id);
    if (!isBannerExists) {
        return res.status(404).json({ message: "banner not found" });
    }

    const publicIds = isBannerExists.Images.map((img) => img.public_id);
    
    await cloudinaryConfig().api.delete_resources(publicIds);
    const folderPath = `${process.env.UPLOADS_FOLDER}/banners/${isBannerExists.section}`;
    await cloudinaryConfig().api.delete_folder(folderPath);
    await Banner.findByIdAndDelete(isBannerExists._id)
    return res.status(200).json({message:"banner deleted successfully"})
}

export const getBanners=async(req,res,next)=>{
    const {section}=req.params;
    if(!section)
        return next(new Error('Please select a section',{cause:400}));
    const banners=await Banner.findOne({section}).select('-addedBy -Images._id -Images.public_id');
    return res.status(200).json({sucess:true,banners})
}

export const updateBanner=async(req,res,next)=>{
    const {id}=req.params;
    if(!id)
        return next(new Error('Please provide banner id',{cause:400}));
    const isBannerExists= await Banner.findById(id);
    if (!isBannerExists) {
        return res.status(404).json({ message: "banner not found" });
    }
    const publicIds = isBannerExists.Images.map((img) => img.public_id);
    await cloudinaryConfig().api.delete_resources(publicIds);

    if(!req.files.length){
        return next(new Error('Please upload an image',{cause:400}));
    }
    const Images=[]
    const folder = `${process.env.UPLOADS_FOLDER}/banners/${isBannerExists.section}`;
    for (const img of req.files){
        const {public_id,secure_url} = await uploadFile({
            file:img.path,
            folder
        })
        Images.push({public_id,secure_url})
    }
    isBannerExists.Images=Images
    await isBannerExists.save();
    return res.status(200).json({sucess:true,banner:isBannerExists})
}