import mongoose from "mongoose";
export const connectDB = async () => {
    try {
        // await mongoose.connect(process.env.MONGO_URI, {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // });
        const con = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected :", con.connection.host);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
