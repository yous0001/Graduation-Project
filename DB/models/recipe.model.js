import mongoose from "../global-setup.js";
import slugify from "slugify";
import { Badges } from "../../SRC/utils/enums.utils.js";

const {Schema,model}=mongoose

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
        unique: true,
        default:function() {
            return slugify(this.name,{replacement: "_",lower: true,})
        }
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
        }]
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
    number_of_ratings: {
        type: Number,
        default: 0
    },
    badges:{
        type: String,
        enum: Object.values(Badges),
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

// Performance Indexes for high-frequency queries and sorting
recipeSchema.index({ category: 1, views: -1 });
recipeSchema.index({ country: 1, views: -1 });
recipeSchema.index({ views: -1, _id: 1 });
recipeSchema.index({ Average_rating: -1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ "ingredients.ingredient": 1 });

const Recipe = mongoose.models.Recipe || model('Recipe',recipeSchema)
export default Recipe;