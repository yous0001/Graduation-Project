import Recommendation from "../../../DB/models/recommended.model.js"

export const getRecommendations=async(req,res)=>{
    const recommendations=await Recommendation.find()
    res.status(200).json({
        success:true,
        recommendations
    })
}

export const getSpecificRecommendation=async(req,res)=>{
    const {name}=req.params;
    const recommendation=await Recommendation.findOne({originalTitle:name})
    res.status(200).json({
        success:true,
        recommendation
    })
}