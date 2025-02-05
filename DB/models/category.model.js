import mongoose, { model } from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim:true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    image:{
        secure_url:{type:String},
        public_id:{type:String} 
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}
,{timestamps: true});

const Category = mongoose.models.Category || model('Category',categorySchema)
export default Category;