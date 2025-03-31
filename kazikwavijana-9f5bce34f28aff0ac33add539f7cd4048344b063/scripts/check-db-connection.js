// Script to check MongoDB connection status
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Get MongoDB URIs
const MONGODB_URI = process.env.MONGODB_URI;
const LOCAL_MONGODB_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/job-portal';

// Connection options
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 10000,
};

console.log('=== MongoDB Connection Checker ===');
console.log('This script will test your MongoDB connections and provide troubleshooting information.');
console.log('\nEnvironment Variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- MONGODB_URI: ${MONGODB_URI ? '✓ Set' : '✗ Not set'}`);
console.log(`- LOCAL_MONGODB_URI: ${process.env.LOCAL_MONGODB_URI ? '✓ Set' : '✗ Using default'}`);

// Test primary MongoDB connection
async function testPrimaryConnection() {
  console.log('\n=== Testing Primary MongoDB Connection ===');
  try {
    console.log(`Attempting to connect to: ${MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);
    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    console.log('✅ Successfully connected to primary MongoDB instance');
    await client.db().command({ ping: 1 });
    console.log('✅ Database ping successful');
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Primary MongoDB connection failed:');
    console.error(error.message);
    
    // Provide troubleshooting tips based on error
    if (error.code === 'ECONNREFUSED') {
      console.log('\nTroubleshooting tips for connection refused:');
      console.log('1. Check if your MongoDB Atlas cluster is running');
      console.log('2. Verify your IP address is whitelisted in MongoDB Atlas');
      console.log('3. Check if there are any network restrictions preventing the connection');
    } else if (error.message.includes('authentication failed')) {
      console.log('\nTroubleshooting tips for authentication failure:');
      console.log('1. Verify your username and password in the connection string');
      console.log('2. Check if the database user has the correct permissions');
    } else if (error.message.includes('querySrv')) {
      console.log('\nTroubleshooting tips for DNS SRV resolution failure:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the hostname in your connection string');
      console.log('3. Try using a direct connection string instead of SRV format');
      console.log('   - Change: mongodb+srv://user:pass@cluster.example.net/dbname');
      console.log('   - To: mongodb://user:pass@cluster-shard-00-00.example.net:27017,cluster-shard-00-01.example.net:27017,cluster-shard-00-02.example.net:27017/dbname?ssl=true&replicaSet=atlas-abcdef&authSource=admin');
    }
    
    return false;
  }
}

// Test local MongoDB connection
async function testLocalConnection() {
  console.log('\n=== Testing Local MongoDB Connection ===');
  try {
    console.log(`Attempting to connect to: ${LOCAL_MONGODB_URI}`);
    const client = new MongoClient(LOCAL_MONGODB_URI, options);
    await client.connect();
    console.log('✅ Successfully connected to local MongoDB instance');
    await client.db().command({ ping: 1 });
    console.log('✅ Database ping successful');
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Local MongoDB connection failed:');
    console.error(error.message);
    
    console.log('\nTroubleshooting tips for local MongoDB:');
    console.log('1. Check if MongoDB is installed and running locally');
    console.log('2. Run: mongod --version (to check if MongoDB is installed)');
    console.log('3. Run: brew services start mongodb-community (macOS) or net start MongoDB (Windows)');
    console.log('4. Consider installing MongoDB locally or using MongoDB Atlas');
    
    return false;
  }
}

// Test mongoose connection
async function testMongooseConnection() {
  console.log('\n=== Testing Mongoose Connection ===');
  try {
    console.log('Attempting to connect with Mongoose...');
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Mongoose connection successful');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.error('❌ Mongoose connection failed:');
    console.error(error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const primaryResult = await testPrimaryConnection();
  
  if (!primaryResult) {
    const localResult = await testLocalConnection();
    
    if (!localResult) {
      console.log('\n❌ Both primary and local connections failed.');
      console.log('Your application may not function correctly without a database connection.');
    } else {
      console.log('\n⚠️ Primary connection failed, but local connection succeeded.');
      console.log('Your application will use the local database as a fallback.');
    }
  } else {
    console.log('\n✅ Primary connection successful. Your application should work correctly.');
  }
  
  // Test mongoose connection
  await testMongooseConnection();
  
  console.log('\n=== Connection Test Summary ===');
  console.log(`Primary MongoDB: ${primaryResult ? '✅ Connected' : '❌ Failed'}`);
  console.log(`Local MongoDB: ${await testLocalConnection() ? '✅ Connected' : '❌ Failed'}`);
  
  console.log('\nFor more help, visit: https://docs.mongodb.com/manual/administration/connection-issues/');
  
  // Exit process
  process.exit(0);
}

runTests().catch(console.error);
