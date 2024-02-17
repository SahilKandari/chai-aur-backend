// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';
import connectDB from "./db/index.js";

dotenv.config({
  path:'./env'
});

connectDB();

/*
import mongoose from "mongoose";
import { DB_Name } from "./constant";
import express from 'express';
const app = express();
( async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)

    app.on('error', (error) =>{
      console.log(error,'error');
      throw(error);
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listingin in port ${process.env.PORT}`);
    });

  } catch (error) {
    console.log(error, 'error');
  }
})();
*/ 