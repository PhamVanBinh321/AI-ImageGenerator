import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // Provide helpful guidance for common Atlas connection issues
        if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.error('\n⚠️  IP Whitelist Issue Detected!');
            console.error('📋 To fix this:');
            console.error('1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com/');
            console.error('2. Navigate to: Network Access → Add IP Address');
            console.error('3. Add your current IP address (or use 0.0.0.0/0 for development - less secure)');
            console.error('4. Wait a few minutes for changes to propagate');
            console.error('5. Try connecting again\n');
        }
        
        process.exit(1);
    }
};

export default connectDB;