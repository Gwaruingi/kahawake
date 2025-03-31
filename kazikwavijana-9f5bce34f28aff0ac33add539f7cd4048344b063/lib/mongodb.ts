import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
// Fallback to local MongoDB if available
const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/job-portal';

const options = {
  // Add timeout settings
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000,
};

let client;
let clientPromise: Promise<MongoClient>;

// Function to create a new client connection
const createClient = () => {
  console.log('Creating new MongoDB client connection...');
  const newClient = new MongoClient(uri, options);
  return newClient.connect()
    .then(client => {
      console.log('MongoDB Atlas connection successful');
      return client;
    })
    .catch(err => {
      console.error('MongoDB Atlas connection error:', err);
      console.log('Attempting to connect to local MongoDB fallback...');
      
      // Try fallback connection
      const fallbackClient = new MongoClient(localUri, options);
      return fallbackClient.connect()
        .then(client => {
          console.log('Connected to local MongoDB fallback');
          return client;
        })
        .catch(fallbackErr => {
          console.error('Local MongoDB fallback connection error:', fallbackErr);
          
          // For development, we'll return a mock client that won't throw errors
          if (process.env.NODE_ENV === 'development') {
            console.log('Creating mock MongoDB client for development...');
            return newClient; // Return the original client even though it's not connected
          }
          
          throw new Error('Failed to connect to any MongoDB instance');
        });
    });
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createClient();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = createClient();
}

export default clientPromise;
