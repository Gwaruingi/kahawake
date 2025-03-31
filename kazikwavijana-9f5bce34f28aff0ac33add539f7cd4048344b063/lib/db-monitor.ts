import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

// Connection states
type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

// Database health statistics
interface DbStats {
  connectionState: ConnectionState;
  lastConnected: Date | null;
  lastDisconnected: Date | null;
  reconnectAttempts: number;
  errors: Array<{
    timestamp: Date;
    message: string;
  }>;
  isHealthy: boolean;
}

// Initialize stats
const dbStats: DbStats = {
  connectionState: 'disconnected',
  lastConnected: null,
  lastDisconnected: null,
  reconnectAttempts: 0,
  errors: [],
  isHealthy: false,
};

// Maximum number of errors to keep in history
const MAX_ERROR_HISTORY = 10;

// Add error to history
const addError = (message: string) => {
  const error = {
    timestamp: new Date(),
    message,
  };
  
  dbStats.errors.unshift(error);
  
  // Keep only the most recent errors
  if (dbStats.errors.length > MAX_ERROR_HISTORY) {
    dbStats.errors = dbStats.errors.slice(0, MAX_ERROR_HISTORY);
  }
};

// Set up mongoose connection monitoring
export const setupMongooseMonitoring = () => {
  // Connection events
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connection established');
    dbStats.connectionState = 'connected';
    dbStats.lastConnected = new Date();
    dbStats.isHealthy = true;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
    dbStats.connectionState = 'disconnected';
    dbStats.lastDisconnected = new Date();
    dbStats.isHealthy = false;
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
    dbStats.connectionState = 'error';
    dbStats.isHealthy = false;
    addError(`Mongoose: ${err.message}`);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('Mongoose reconnected');
    dbStats.connectionState = 'connected';
    dbStats.lastConnected = new Date();
    dbStats.isHealthy = true;
    dbStats.reconnectAttempts += 1;
  });
};

// Check MongoDB connection health
export const checkMongoDbHealth = async (uri: string): Promise<boolean> => {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    await client.db().command({ ping: 1 });
    
    return true;
  } catch (error: any) {
    addError(`Health check: ${error.message}`);
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

// Get current database status
export const getDbStatus = (): DbStats => {
  return { ...dbStats };
};

// Reset connection stats (for testing)
export const resetStats = () => {
  dbStats.connectionState = 'disconnected';
  dbStats.lastConnected = null;
  dbStats.lastDisconnected = null;
  dbStats.reconnectAttempts = 0;
  dbStats.errors = [];
  dbStats.isHealthy = false;
};

// Initialize monitoring
setupMongooseMonitoring();

// Export for API usage
export default {
  getDbStatus,
  checkMongoDbHealth,
  resetStats,
};
