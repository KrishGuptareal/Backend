import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; //file systek=m

//user--->server(local storage)--->cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUND_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload the file
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localFilePath)
        //console.log("file uploaded on cloudinary :" ,response.url)
        return response 
    } catch (error) {
        //remove from the server
        fs.unlinkSync(localFilePath)
        return null;
    }
}

const deleteAsset = async (publicId, resourceType = 'image') => {
  try {
    // The 'destroy' method deletes the asset
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType, // Specify 'video' or 'raw' if needed
      invalidate: true, // Optional: invalidates cached copies on the CDN
    });
    console.log(`Deletion result for ${publicId}:`, result);
    return result;
  } catch (error) {
    console.error(`Error deleting asset ${publicId}:`, error);
    return null;
  }
};

export {uploadOnCloudinary,deleteAsset}
