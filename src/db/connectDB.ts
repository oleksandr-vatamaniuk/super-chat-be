import * as mongoose from "mongoose";

export async function connectDB(url: string){
    mongoose.set("strictQuery", false);
    return mongoose.connect(url);
}