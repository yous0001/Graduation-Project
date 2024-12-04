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

export const login = async()=>{

}