import sendmailservice from './../Services/sendMail.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './../../../DB/models/user.model.js';
import { forgetPasswordRequestEmailTemplete, loginVerificationEmailTemplete, resetPasswordSuccess, verificationEmailTemplate } from './../Services/emailTempletes.js';
import { generateVerificationCode } from '../../utils/generateVerificationCode.js';
import crypto from 'crypto';
import { cloudinaryConfig } from './../../utils/cloudinary.utils.js';

export const register = async(req,res,next)=>{
    const {name,email,password,phoneNumbers} = req.body;
    const isEmailExists = await User.findOne({email});
    if(isEmailExists){
        return res.status(400).json({message:"email already exists"});    
    }
    const hashedPassword=bcrypt.hashSync(password,+process.env.SALT_ROUNDS);
    const usertoken=jwt.sign({email},process.env.JWT_SECRET_VERFICATION,{expiresIn:'1d'})
    
    const isEmailsent=await sendmailservice({
        to:email,
        subject:"please verify your email",
        message:verificationEmailTemplate.replace("{{url}}",`${req.protocol}://${req.headers.host}/auth/verify-email?token=${usertoken}`),
        attachments:[]
    })

    if(!isEmailsent){
        return res.status(500).json({message:"failed to send verification email"});
    }

    let newUser =await User.create({
        username:name,email,password:hashedPassword,phoneNumbers
    })
    newUser = newUser.toObject();
    delete newUser.password;
    return res.status(201).json({
        message:"user created successfully",
        newUser
    });
}



export const verifyEmail=async(req,res,next)=>{
    const {token}=req.query
    const decodedData=jwt.verify(token,process.env.JWT_SECRET_VERFICATION)

    const user = await User.findOneAndUpdate(
        { email: decodedData.email, isEmailVerified: false },
        { isEmailVerified: true },
        { new: true }
    ).select("-password");

    if(!user){
        return next(new Error("user not found",{cause:404}))
    }
    res.status(200).json({
        success:true,
        message:"email verified succefully",
        data:user
    })
}

export const login = async(req,res,next)=>{
    const {email,password}=req.body;
    if(!email||!password){
        return res.status(400).json({message:"Please provide all required fields"});
    }
    const user = await User.findOne({email});
    if(!user){
        return res.status(401).json({message:"Invalid credentials"});
    }
    if(!user.isEmailVerified){
        return res.status(401).json({message:"Please verify your email"});
    }
    const isPasswordMatch =await bcrypt.compare(password,user.password);
    if(!isPasswordMatch){
        return res.status(401).json({message:"Invalid credentials"});
    }

    const verificationCode=generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + (1000 * 60 * 5);
    await user.save();

    const isCodeSent=await sendmailservice({
        to:user.email,
        subject:"please verify your account",
        message:loginVerificationEmailTemplete.replace("{{code}}",verificationCode),
        attachments:[]
    })

    if(!isCodeSent){
        return res.status(500).json({message:"failed to send verification email"});
    }
    res.status(200).json({message:"verification code sent successfully"});
}

export const verifyLoginCode = async(req,res,next)=>{
    const {code}=req.body;

    const user = await User.findOne({verificationCode:code,
        verificationCodeExpires:{ $gt: Date.now() }});
    if(!user){
        return res.status(404).json({message:"Invalid verification code"});
    }
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.isLoggedIn=true;
    await user.save();

    const accessToken=jwt.sign({email:user.email,id:user._id},process.env.JWT_SECRET_LOGIN,{expiresIn:"1d"})
    const refreshToken=jwt.sign({id:user._id},process.env.JWT_SECRET_refresh,{expiresIn:"6d"})

    res.status(200).json({message:"login successful",accessToken:accessToken,refreshToken})
    }


export const refreshToken =async (req,res,next) => {
    let refreshToken = req.headers.refreshtoken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Please login first" });
    }
    const decodedData = jwt.verify(refreshToken, process.env.JWT_SECRET_refresh);
        
    if (!decodedData || !decodedData.id) {
        return res.status(400).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decodedData.id);

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const accessToken=jwt.sign({email:user.email,id:user._id},process.env.JWT_SECRET_LOGIN,{expiresIn:"1d"})
    refreshToken=jwt.sign({id:user._id},process.env.JWT_SECRET_refresh,{expiresIn:"6d"})
    
    res.status(200).json({message:"new token has been created",accessToken:accessToken,refreshToken:refreshToken})
}


export const forgetPassword=async(req,res,next)=>{
    const {email}=req.body;
    try{
        if(!email){
            return res.status(400).json({success:false,message:"please provide email"})
        }
        const user=await User.findOne({email})
        if(!user){
            return res.status(404).json({
                success:false,
                message:"user not found"
            })
        }
        const resetToken=crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken=resetToken;
        user.resetPasswordExpires=Date.now() + (30*60*1000) //30 minutes
        await user.save();
        await sendmailservice({
            to:user.email,
            subject:'reset password',
            message:forgetPasswordRequestEmailTemplete.replace(`{{reset_link}}`,`${req.protocol}://${req.headers.host}/auth/reset-password/${resetToken}`),
            attachments:[]
            })
            return res.status(200).json({success:true,message:"reset password link sent successfully"})
    }catch(err){
        return res.status(500).json({success:false,message:err.message})
    }
}


export const resetPassword=async(req,res,next)=>{
    const {token}=req.params;
    const {password}=req.body;
    try{
        if(!password){
            return res.status(400).json({success:false,message:"please provide password"})
        }
        const user=await User.findOne({resetPasswordToken:token,resetPasswordExpires:{ $gt: Date.now() }})
        if(!user){
            return res.status(404).json({
                success:false,
                message:"invalid or expired token"
            })
        }
        const hashedPassword=await bcrypt.hash(password,+process.env.SALT_ROUNDS);
        user.password=hashedPassword;
        user.resetPasswordToken=null;
        user.resetPasswordExpires=null;
        await user.save();
        await sendmailservice({
            to:user.email,
            subject:'password reset success',
            message:resetPasswordSuccess,
            attachments:[]
            })
        return res.status(200).json({success:true,message:"reset password success"})
    }catch(err){
        return res.status(500).json({success:false,message:err.message})    
    }

}
export const resendOtp=async(req,res,next)=>{
    const {email}=req.body;
    if(!email){
        return res.status(400).json({message:"Please email is required"});
    }
    const user = await User.findOne({email});
    if(!user){
        return res.status(401).json({message:"uncorrect email address"});
    }
   
    if(new Date(user.verificationCodeExpires+(1000 * 60 * 10)).getTime() < Date.now()){
        return res.status(400).json({message:"you can resend otp only within 10 minutes"});
    }
    const verificationCode=generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + (1000 * 60 * 5);
    await user.save();

    const isCodeSent=await sendmailservice({
        to:user.email,
        subject:"resend otp to verify your account",
        message:loginVerificationEmailTemplete.replace("{{code}}",verificationCode),
        attachments:[]
    })

    if(!isCodeSent){
        return res.status(500).json({message:"failed to resend verification email"});
    }
    res.status(200).json({message:"otp code resent successfully"});
}
export const getProfile = async function (req, res, next) {
    let user = req.user;
    if (!user) {
        return res.status(404).json({ message: "user not found" });
    }
    user=user.toObject();
    delete user.profileImage.public_id
    delete user.password;
    delete user.isEmailVerified
    delete user.isLoggedIn
    delete user.verificationCode
    delete user.verificationCodeExpires
    delete user.resetPasswordExpires
    delete user.resetPasswordToken
    delete user.favoriteRecipes
    delete user.ownedIngredients
    res.status(200).json(user);
  };
export const deleteUser = async function (req, res, next) {
    const user = req.user;
    const deletedUser =await User.findByIdAndDelete(user._id);
    if (!deletedUser) {
        return res.status(404).json({ message: "user deletetion failed" });
    }
    res.status(200).json({message:"user deleted successfully",message2:"في 60 الف داهيه"});
  };

export const uploadProfileImg = async(req, res, next)=>{
    const user = req.user;
    const file = req.file;
    if(!file){
        return res.status(400).json({message:"please provide profile image"});
    }
    if(user.profileImage?.public_id){
        await cloudinaryConfig().uploader.destroy(user.profileImage.public_id);
    }
    const uploadedImg=await cloudinaryConfig().uploader.upload(file.path,{
        folder:"recipesSystem/users",
        resource_type:"image",
        tags:["profile","image"]
    });
    if(!uploadedImg.secure_url){
        return res.status(500).json({message:"failed to upload profile image"});
    }
    user.profileImage={
        public_id:uploadedImg.public_id,
        secure_url:uploadedImg.secure_url
    }
    await user.save();
    user.password="hidden"
    res.status(200).json({message:"profile image uploaded successfully",user})
}

export const deleteProfileImg = async(req, res, next)=>{
    const user = req.user;
    if(!user.profileImage?.public_id)
        return res.status(400).json({message:"no profile image to delete"});

    const deletedImg=await cloudinaryConfig().uploader.destroy(user.profileImage?.public_id);
    if(deletedImg.result!='ok')//check if image deleted
        return res.status(400).json({message:"error", error:deletedImg.result})
    user.profileImage=null
    await user.save();
    res.status(200).json({message:"profile image deleted successfully",deletedImg})
}

export const changePassword = async(req, res, next)=>{
    const user = req.user;
    const {oldPassword, newPassword}=req.body;
    const isPasswordMatch =await bcrypt.compare(oldPassword, user.password);
    if(!isPasswordMatch)
        return res.status(400).json({message:"old password is incorrect"});
    const hashedPassword=await bcrypt.hash(newPassword,+process.env.SALT_ROUNDS);
    user.password=hashedPassword;
    await user.save();
    res.status(200).json({message:"password changed successfully"});
}

export const updateUser = async(req, res, next)=>{
    const user = req.user;
    const {name,phoneNumbers,age,address}=req.body;
    if(name)
        user.name=name;
    if(phoneNumbers)
        user.phoneNumbers=phoneNumbers;
    if(age)
        user.age=age;
    if(address)
        user.address=address;
    await user.save();
    res.status(200).json({message:"user updated successfully",user});
}