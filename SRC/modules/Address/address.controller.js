import Address from "../../../DB/models/address.model.js";
import User from "../../../DB/models/user.model.js";


export const addAddress=async(req,res,next)=>{
    const user = req.user;
    const {country,city,postalCode,buildingNumber,floorNumber,addressLabel,notes}=req.body;
    
    if(!country||!city||!postalCode||!buildingNumber||!floorNumber) 
        return res.status(400).json({message:"Please provide all the required fields"});
    
    const addressObject={
        country,
        city,
        postalCode,
        buildingNumber,
        floorNumber,
        addressLabel,
        notes,
        userId:user._id
    }

    const newAddress=await Address.create(addressObject)
    await User.findByIdAndUpdate(user._id, { $push: { addresses: newAddress._id } });
    
    res.status(200).json({message:"address added successfully",newAddress})
} 