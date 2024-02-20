// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from './app.js'

dotenv.config({
  path:'./env'
});

connectDB()
.then(() => {
  app.on('error', (error) =>{
    console.log(error,'error');
    throw(error);
  });
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at ${process.env.PORT}`);
  });
})
.catch((err) => {
  console.log('MongoDB Connection Failed!', err);
});

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