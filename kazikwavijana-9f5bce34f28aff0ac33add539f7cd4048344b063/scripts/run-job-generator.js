// Script to connect to MongoDB and run the job generator
require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read the job generator script
const scriptPath = path.join(__dirname, 'generate-jobs.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// MongoDB connection
async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Please add your MongoDB URI to .env.local');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    
    // Find an admin user to set as the job poster
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating a default user as the job poster...');
      // You can create a default user here if needed
    } else {
      console.log(`Found admin user: ${adminUser._id}`);
      // Replace the placeholder in the script with the actual admin user ID
      scriptContent = scriptContent.replace(
        /const adminUserId = ObjectId\([^)]+\);/,
        `const adminUserId = ObjectId("${adminUser._id}");`
      );
    }

    // Execute the script in the MongoDB context
    console.log('Generating job listings...');
    
    // Create a function that includes the script content
    const generateJobs = new Function('db', 'ObjectId', scriptContent);
    
    // Execute the function with the database and ObjectId
    generateJobs(db, ObjectId);
    
    console.log('Job listings generated successfully');
    
    // Verify the jobs were created
    const jobCount = await db.collection('jobs').countDocuments();
    console.log(`Total jobs in database: ${jobCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);
