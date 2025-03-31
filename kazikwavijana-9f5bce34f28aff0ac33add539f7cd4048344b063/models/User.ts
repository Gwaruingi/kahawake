import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';

// Initialize MongoDB connection
const initMongoDB = async () => {
  try {
    // Wait for MongoDB client to connect
    const client = await clientPromise;
    console.log('MongoDB client connected successfully');
    
    // Ensure mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
      });
      console.log('Mongoose connected successfully');
    }
    
    return true;
  } catch (error) {
    console.error('MongoDB/Mongoose connection error:', error);
    return false;
  }
};

// Initialize connection (will be called when this module is imported)
initMongoDB();

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'company', 'jobseeker'], 
    default: 'jobseeker' 
  },
  companyName: { 
    type: String,
    required: function() { return this.role === 'company'; }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
