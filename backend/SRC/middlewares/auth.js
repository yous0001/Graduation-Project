import { systemRoles } from "../utils/system-roles.js";

export const auth=async(accessRoles=[systemRoles.USER,systemRoles.ADMIN,systemRoles.DELIVERY])=>{
    return async(req,res,next) =>{
        try{
            const accessToken=req.headers;
        if(!accessToken){
            res.status(404).json({message:"please login first"});
        }
        if(!accessToken.startswith(process.env.TOKEN_PREFIX)){
            res.status(400).json({message:"invalid token prefix"});
        }
        const token=accessToken.split(process.env.TOKEN_PREFIX.length)[1];
        const decodedData=jwt.verify(token,process.env.JWT_SECRET_VERFICATION);

        if(!decodedData || !decodedData?.id){
            res.status(400).json({message:"invalid token payload"});
        }
        const user=await User.findById(decodedData.id);
        if(!user){
            res.status(404).json({message:"user not found"});
        }
        if(!accessRoles.includes(user.role)){
            res.status(401).json({message:"unauthorized"});
        }
        req.user=user;
        next();
        }catch(err){
            res.status(500).json({message:"error in auth middleware"});
        }
        

    }
}