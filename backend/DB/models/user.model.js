import mongoose, { model } from "mongoose";
import { systemRoles } from "../../src/utils/system-roles.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20,
        tirm: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        tirm: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    phoneNumbers: [{
        type: String,
        required: true,
    }],
    addresses: [{
        type: String,
        required: true
    }],
    role: {
        type: String,
        enum: Object.values(systemRoles),
        default: systemRoles.USER
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    favoriteRecipes: [{ 
        type: Schema.Types.ObjectId,
        ref: 'Recipe' 
    }],
    profileImage: { 
        //this is for uploading profile image on cloud
        secure_url:{type:String,reqired:true},
        public_id:{type:String,unique:true,required:true} 
    },
    ownedIngredients:[{ 
        type: Schema.Types.ObjectId,
            ref: 'Ingredient' 
    }] 

},{timestamps:true});

const User = mongoose.models.User || model('User',userSchema)
export default User;