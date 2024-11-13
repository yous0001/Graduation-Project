import express from 'express';
import { config } from 'dotenv';

// Load environment variables from.env file
config({path:"./config/dev.env"})

const app = express();
const port = process.env.PORT;
app.listen(port, ()=>{
    console.log(`app is running on port ${port}`)});