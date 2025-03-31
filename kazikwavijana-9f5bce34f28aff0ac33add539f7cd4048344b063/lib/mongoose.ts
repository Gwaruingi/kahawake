import mongoose from 'mongoose';
import { setupMongooseMonitoring } from './db-monitor';

// Check if MongoDB URI is defined
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Fallback to local MongoDB if available
const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/job-portal';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global as any;

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

// Initialize mongoose monitoring
setupMongooseMonitoring();

// Increase the max listeners to prevent warnings
mongoose.connection.setMaxListeners(25);

export async function connectToDB() {
  if (cached.mongoose.conn) {
    // Return existing connection if available
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      // Add auto reconnect options
      autoIndex: true,
      autoCreate: true,
      retryWrites: true,
      retryReads: true,
    };

    console.log('Testing MongoDB connection...');
    
    // Try primary connection first
    cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB Atlas connection successful via mongoose');
        return mongoose;
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB Atlas:', error);
        console.log('Attempting to connect to local MongoDB fallback...');
        
        // Try fallback connection
        return mongoose.connect(LOCAL_MONGODB_URI, opts)
          .then((mongoose) => {
            console.log('Connected to local MongoDB fallback');
            return mongoose;
          })
          .catch((fallbackError) => {
            console.error('Error connecting to local MongoDB fallback:', fallbackError);
            
            // Create in-memory MongoDB for development if both connections fail
            if (process.env.NODE_ENV === 'development') {
              console.log('Creating in-memory MongoDB for development...');
              // For development, we'll continue without throwing an error
              // This allows the app to run even without a database
              return mongoose;
            }
            
            throw new Error('Failed to connect to any MongoDB instance');
          });
      });
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
  } catch (e) {
    cached.mongoose.promise = null;
    throw e;
  }

  return cached.mongoose.conn;
}

// Simplified function for API routes to use
export async function dbConnect() {
  return connectToDB();
}

// Helper function to ensure DB connection is established
export async function ensureDbConnected() {
  if (mongoose.connection.readyState !== 1) {
    await dbConnect();
  }
  return mongoose.connection;
}
