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
    
    res.status(200).json({message:"address added successfully",address:newAddress});
} 

export const getAddresses=async(req,res,next)=>{
    const user = req.user;
    const addresses=user.addresses
    res.status(200).json({message:"addresses fetched successfully",addresses});
}

export const updateAddress=async(req,res,next)=>{
    const user = req.user;
    const {addressId}=req.params;
    const {country,city,postalCode,buildingNumber,floorNumber,addressLabel,notes}=req.body;
    
    if(!addressId) 
        return res.status(400).json({message:"Please provide the address id"});

    const isAddrecessExist=await Address.findById(addressId);

    if(!isAddrecessExist) 
        return res.status(400).json({message:"Address not found"});
    if(isAddrecessExist.userId.toString()!==user._id.toString() ) 
        return res.status(400).json({message:"this is not your address. you aren't authorized to update this address"});


    const addressObject={
    }

    if(country) addressObject.country=country;
    if(city) addressObject.city=city;
    if(postalCode) addressObject.postalCode=postalCode;
    if(buildingNumber) addressObject.buildingNumber=buildingNumber;
    if(floorNumber) addressObject.floorNumber=floorNumber;
    if(addressLabel) addressObject.addressLabel=addressLabel;
    if(notes) addressObject.notes=notes;

    if(Object.keys(addressObject).length===0) 
        return res.status(400).json({message:"Please provide at least one field to update"});

    const updatedAddress=await Address.findByIdAndUpdate(addressId,addressObject,{new:true});
    res.status(200).json({message:"address updated successfully",address:updatedAddress});
}

export const deleteAddress=async(req,res,next)=>{
    const user = req.user;
    const {addressId}=req.params;

    if(!addressId) 
        return res.status(400).json({message:"Please provide the address id"});

    const isAddrecessExist=await Address.findById(addressId);
    if(!isAddrecessExist) 
        return res.status(400).json({message:"Address not found"});
    if(isAddrecessExist.userId.toString()!==user._id.toString() ) 
        return res.status(400).json({message:"this is not your address. you aren't authorized to delete this address"});

    await Address.findByIdAndDelete(addressId);
    res.status(200).json({message:"address deleted successfully"});
}

export const getDefaultAddress=async(req,res,next)=>{
    const user = req.user;
    const defaultAddress = user.addresses.filter(address => address.isDefault === true)[0];

    res.status(200).json({message:"default address fetched successfully",defaultAddress});
}

export const setAsDefaultAddress=async(req,res,next)=>{
    const user = req.user;
    const {addressId}=req.params;

    if(!addressId) 
        return res.status(400).json({message:"Please provide the address id"});

    const isAddrecessExist=await Address.findById(addressId);
    if(!isAddrecessExist) 
        return res.status(400).json({message:"Address not found"});
    if(isAddrecessExist.userId.toString()!==user._id.toString() ) 
        return res.status(400).json({message:"this is not your address. you aren't authorized to update this address"});
    
    await Address.updateMany({ userId: user._id, isDefault: true }, { $set: { isDefault: false } });
    await Address.findByIdAndUpdate(addressId, { $set: { isDefault: true } });

    res.status(200).json({message:"address set as default successfully"});
}