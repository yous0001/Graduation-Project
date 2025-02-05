import { v2 as cloudinary } from "cloudinary";


export const cloudinaryConfig=()=>{
    cloudinary.config({
        cloud_name: process.env.Cloud_name ,
        api_key: process.env.API_key,
        api_secret: process.env.API_secret
    })
    return cloudinary;
}


export const uploadFile = async ({ file, folder = "General", publicId }) => {
        if (!file) {
        return next(
            new ErrorClass("Please upload an image", 400, "Please upload an image")
        );
        }
    
        let options = { folder };
        if (publicId) {
        options.public_id = publicId;
        }
    
        const { secure_url, public_id } = await cloudinaryConfig().uploader.upload(
        file,
        options
        );
    
        return { secure_url, public_id };
    };
  