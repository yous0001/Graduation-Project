import express from 'express';
import { config } from 'dotenv';
import db_connection from './DB/connnection.js';

// Load environment variables from.env file
config({path:"./config/dev.env"})

const app = express();
const port = process.env.PORT;

app.use(express.json());

db_connection();
app.listen(port, ()=>{
    console.log(`app is running on port ${port}`)});