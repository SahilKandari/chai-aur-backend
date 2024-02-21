import { throws } from 'assert';
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //Upload the file in cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });
    
    console.log('File Uploaded on cloudinary successfully', response.url);
    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temp. files due to the uploading process failed
    return;
  }
}

export { uploadOnCloudinary };