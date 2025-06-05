import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
    originalTitle: {
        type: String,
        required: [true, 'Original title is required'],
        trim: true,
        index: true ,
        unique: true
    },
    recipeJson: {
        title: {
            type: String,
            required: [true, 'Recipe title is required'],
            trim: true,
            index: true 
        },
        overview: {
            cuisine: {
                type: String,
                required: [true, 'Cuisine is required'],
                trim: true
            },
            difficulty: {
                type: String,
                enum: {
                    values: ['Easy', 'Medium', 'Hard'],
                    message: 'Difficulty must be Easy, Medium, or Hard'
                },
                required: [true, 'Difficulty is required']
            },
            servings: {
                type: String,
                required: [true, 'Servings is required'],
                trim: true
            },
            preptime: {
                type: String,
                required: [true, 'Prep time is required'],
                trim: true
            },
            cooktime: {
                type: String,
                required: [true, 'Cook time is required'],
                trim: true
            },
            totaltime: {
                type: String,
                required: [true, 'Total time is required'],
                trim: true
            },
            dietarytags: {
                type: [String],
                default: []
            }
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true
        },
        ingredients: {
            type: Array,
            required: [true, 'Ingredients are required'],
            validate: {
                validator: arr => arr.length > 0,
                message: 'Ingredients array cannot be empty'
            }
        },
        instructions: {
            type: Array,
            required: [true, 'Instructions are required'],
            validate: {
                validator: arr => arr.length > 0,
                message: 'Instructions array cannot be empty'
            }
        },
        tipsAndVariations: {
            type: [String],
            default: []
        },
        nutrition: {
            type:Object
        }
    },
    recipeMarkdown: {
        type: String,
        required: [true, 'Recipe Markdown is required']
    },
    image: {
        imageUrl: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true,
            default: 'https://via.placeholder.com/800x400?text=Recipe+Image'
        }
    },
    originalIngredients: {
        type: [String],
        default: []
    },
    category: {
        type: String,
        enum: {
            values: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Other'],
            message: 'Category must be Breakfast, Lunch, Dinner, Snack, Dessert, or Other'
        },
        default: 'Other',
        index: true 
    }
}, {
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});



const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
