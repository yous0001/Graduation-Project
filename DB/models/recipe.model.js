import mongoose, { model, Schema } from "mongoose";

const recipeSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true,
        trim: true
    },
    slug: { 
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: { 
        type: String
    },
    ingredients:[
        {
            ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient' }, // Reference to Ingredient model
            amount: { type: String, required: true } // Amount of this ingredient
        }
    ],
    directions: { 
        type: String,
        required: true 
    },
    Images:{ 
        URLs:[{
            secure_url:{
                type:String,
                required: true
            },
            public_id:{
                type:String,
                required: true
            } 
        }],
        customID:{type:String, required:true}
    },
    videoLink:{ 
        type: String
    },
    tags:[{
        type: String,
        required: false
    }]
    ,
    category: { 
        type: Schema.Types.ObjectId,
        ref: 'Category' 
    },
    country: { 
        type: Schema.Types.ObjectId,
        ref: 'Country' 
    },
    Average_rating: {
        type: Number,
        min:0,
        max:5,
        default: 0 
    },
    badges:{
        type: String,
        enum: ['New', 'Trending', 'best recipe'],
    },
    views:{
        type: Number,
        default: 0
    },
    createdBy: {
        type:Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type:Schema.Types.ObjectId,
        ref: 'User'
    }
},{timestamps:true});

const Recipe = mongoose.models.Recipe || model('Recipe',recipeSchema)
export default Recipe;