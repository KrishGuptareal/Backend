import mongoose from "mongoose";

import { DB_Name } from "../constants.js";

const connectDB= async ()=>{    
     try {
        const connecitonInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)//this i a responce at the time of connection we get 
        console.log(`\n MongoDb connected DB Host: ${connecitonInstance.connection.host}`)
     } catch (error) {
        console.log("Mongo db conneciton Error :",error);
        process.exit(1)
     }
}

export default connectDB