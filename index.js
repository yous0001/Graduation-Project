import express from 'express';
import { config } from 'dotenv';
import db_connection from './DB/connnection.js';
import authRouter from './SRC/modules/Auth/auth.router.js';
import categoryRouter from './SRC/modules/Category/category.router.js';
import countryRouter from './SRC/modules/Country/country.router.js';
import ingredientRouter from "./SRC/modules/Ingredient/ingredient.router.js";
import receipeRouter from "./SRC/modules/Recipe/recipe.router.js";
import { globalResponse } from './SRC/middlewares/globalResponce.js';
import { cloudinaryConfig } from './SRC/utils/cloudinary.utils.js';


if (process.env.NODE_ENV !== 'production') {
    config({ path: './config/dev.env' });
}

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/auth',authRouter)
app.use('/category',categoryRouter)
app.use('/country',countryRouter)
app.use('/ingredient',ingredientRouter)
app.use('/recipe',receipeRouter)
app.use(globalResponse)
db_connection();

app.get('/test',(req, res) => {
    res.json({message:"test endpoint"})
})
app.get('/test-upload',async (req, res) => {
    const result = await cloudinaryConfig().api.ping()
    res.json(result)
})
app.listen(port, ()=>{
    console.log(`app is running on port ${port}`)});

export default app;