import express from 'express';
import { config } from 'dotenv';
import db_connection from './DB/connnection.js';
import authRouter from './SRC/modules/Auth/auth.router.js';
import categoryRouter from './SRC/modules/Category/category.router.js';

// Load environment variables from.env file
config({path:"./config/dev.env"})

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use('/auth',authRouter)
app.use('category',categoryRouter)

db_connection();

app.listen(port, ()=>{
    console.log(`app is running on port ${port}`)});