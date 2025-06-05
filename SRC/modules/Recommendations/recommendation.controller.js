import Recommendation from "../../../DB/models/recommended.model.js"

export const getRecommendations=async(req,res)=>{
    const recommendations=await Recommendation.find()
    res.status(200).json({
        success:true,
        recommendations
    })
}