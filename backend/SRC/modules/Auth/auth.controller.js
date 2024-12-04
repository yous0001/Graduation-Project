import sendmailservice from './../Services/sendMail.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './../../../DB/models/user.model.js';
import { verificationEmailTemplate } from './../Services/emailTempletes.js';

export const register = async(req,res,next)=>{
    const {name,email,password,phoneNumbers} = req.body;
    if(!email||!password||!phoneNumbers){
        return res.status(400).json({message:"Please provide all required fields"});
    }
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
    const decodeddata=await jwt.verify(token,process.env.JWT_SECRET_VERFICATION)
    const user =await User.findOneAndUpdate({email:decodeddata.email,isEmailVerified:false},{isEmailVerified:true},{new:true}).select("-password")
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
    const token = jwt.sign({email,id:user._id},process.env.JWT_SECRET_VERFICATION,{expiresIn:'1d'})
    return res.status(200).json({
        message:"login successful",
        token
    })
}
export const refreshToken =async (req,res,next) => {
    const {_id}=req.user
    const user =await userModel.findById(_id)
    const newToken=jwt.sign({email:user.email,id:_id},process.env.JWT_SECRET_LOGIN,{expiresIn:"1d"})
    
    res.status(200).json({message:"new token has been created",newToken})
}