// scripts/create-admin.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
    });
    
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Define User Schema (simplified version of your actual User model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'company', 'jobseeker'], 
    default: 'jobseeker' 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
});

// Create User model if it doesn't exist
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Function to create admin user
async function createAdminUser(name, email, password) {
  try {
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User with email ${email} already exists.`);
      
      // Ask if user wants to update the existing user to admin role
      rl.question('Do you want to update this user to admin role? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          existingUser.role = 'admin';
          await existingUser.save();
          console.log(`User ${email} has been updated to admin role.`);
        } else {
          console.log('Operation cancelled.');
        }
        rl.close();
        await mongoose.connection.close();
      });
      
      return;
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new admin user
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    // Save to database
    await adminUser.save();
    
    console.log('Admin user created successfully:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role: admin`);
    
    // Close MongoDB connection
    await mongoose.connection.close();
    rl.close();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    rl.close();
    await mongoose.connection.close();
  }
}

// Main function
async function main() {
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Exiting...');
    rl.close();
    return;
  }
  
  // Prompt for admin user details
  rl.question('Enter admin name: ', (name) => {
    rl.question('Enter admin email: ', (email) => {
      rl.question('Enter admin password: ', async (password) => {
        await createAdminUser(name, email, password);
      });
    });
  });
}

// Run the script
main().catch(console.error);