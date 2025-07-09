import mongoose from 'mongoose';

const mongoURI = process.env.MONGO_URI || ""

class MongoDB {
  private static instance: MongoDB;
  private constructor() { } // Prevent instantiation from outside

  public static async connect(): Promise<void> {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB();

      try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB Connected Successfully");
      } catch (error) {
        console.error("MongoDB Connection Error:", error);
        process.exit(1); // Exit on failure
      }
    }
  }
}

export default MongoDB;
