import mongoose from "mongoose";
import { config } from "./index";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.dbUrl as string);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
