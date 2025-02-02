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

    const token=jwt.sign({email:user.email,id:user._id},process.env.JWT_SECRET_LOGIN,{expiresIn:"1d"})

    res.status(200).json({message:"login successful",token})
    }


export const refreshToken =async (req,res,next) => {
    const {_id}=req.user
    const user =await User.findById(_id)
    const newToken=jwt.sign({email:user.email,id:_id},process.env.JWT_SECRET_LOGIN,{expiresIn:"1d"})
    
    res.status(200).json({message:"new token has been created",newToken})
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
    const user = req.user;
    user.password="hidden"
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

    const uploadedImg=await cloudinaryConfig().uploader.upload(file.path,{
        folder:"recipesSystem/users",
        resource_type:"image",
        tags:["profile","image"],
        public_id: user.profileImage?.public_id || undefined
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