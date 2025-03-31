// Script to generate company users for testing
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// MongoDB connection URI
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Company data
const companies = [
  {
    name: 'TechCorp',
    email: 'hr@techcorp.com',
    password: 'password123', // This will be hashed
    role: 'company',
    isActive: true
  },
  {
    name: 'GlobalFinance',
    email: 'careers@globalfinance.com',
    password: 'password123', // This will be hashed
    role: 'company',
    isActive: true
  },
  {
    name: 'HealthPlus',
    email: 'jobs@healthplus.com',
    password: 'password123', // This will be hashed
    role: 'company',
    isActive: true
  },
  {
    name: 'EduTech Solutions',
    email: 'recruiting@edutech.com',
    password: 'password123', // This will be hashed
    role: 'company',
    isActive: true
  },
  {
    name: 'GreenEnergy',
    email: 'careers@greenenergy.com',
    password: 'password123', // This will be hashed
    role: 'company',
    isActive: true
  }
];

async function main() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Hash passwords and prepare company documents
    const companyDocs = await Promise.all(companies.map(async (company) => {
      const hashedPassword = await bcrypt.hash(company.password, 10);
      return {
        ...company,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }));
    
    // Check if companies already exist
    const existingCompanies = await usersCollection.find({ role: 'company' }).toArray();
    
    if (existingCompanies.length > 0) {
      console.log(`Found ${existingCompanies.length} existing company accounts.`);
      console.log('Company emails:', existingCompanies.map(c => c.email).join(', '));
      
      // Ask if user wants to proceed
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Do you want to add more companies anyway? (y/n): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    // Insert companies
    const result = await usersCollection.insertMany(companyDocs);
    console.log(`${result.insertedCount} company accounts created successfully!`);
    
    // List the created companies
    console.log('Created companies:');
    companyDocs.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company.email})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error);
