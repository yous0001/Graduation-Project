import { v2 as cloudinary } from "cloudinary";
import streamifier from 'streamifier';

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


export function uploadFileBuffer({ buffer, filename, folder }) {
    const sanitizedPublicId = filename
            .replace(/\.[^/.]+$/, '') // Remove file extension
            .replace(/[^a-zA-Z0-9_/-]/g, '-')
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinaryConfig().uploader.upload_stream(
            {
                folder,
                public_id: sanitizedPublicId, // Remove extension
                resource_type: 'image',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
}