import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
        console.log("Connected to MongoDB");
    }catch (error) {
        console.log("Error while connecting to MongoDB", error);
    }
};

export default connectDB;