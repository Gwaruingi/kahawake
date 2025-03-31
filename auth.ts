import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

// Test MongoDB connection - using a separate client to avoid topology issues
const testConnection = async () => {
  let testClient = null;
  try {
    console.log("Testing MongoDB connection...");
    // Use the clientPromise to get connection string, but create a new client for testing
    const client = await clientPromise;
    console.log("MongoDB client connected successfully");
    
    // Create a separate test client to avoid topology issues
    if (process.env.MONGODB_URI) {
      testClient = new MongoClient(process.env.MONGODB_URI, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await testClient.connect();
      await testClient.db().command({ ping: 1 });
      console.log("MongoDB connection successful!");
      return true;
    }
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return false;
  } finally {
    // Close the test client to avoid resource leaks
    if (testClient) {
      try {
        await testClient.close();
      } catch (e) {
        console.error("Error closing test client:", e);
      }
    }
  }
};

// Initialize connection test - but don't block startup if it fails
testConnection().catch(() => console.log("Connection test failed but continuing startup"));

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Please enter your email and password');
          }

          // Ensure MongoDB connection is established
          await testConnection();

          const user = await User.findOne({ email: credentials.email }).exec();
          if (!user) {
            throw new Error('No user found with this email');
          }

          console.log('Found user:', user.email);
          console.log('Stored password hash:', user.password);
          
          // Debug password comparison
          const plainPassword = credentials.password;
          console.log('Attempting to verify password');
          
          const isValid = await bcrypt.compare(plainPassword, user.password);
          console.log('Password verification result:', isValid);
          
          if (!isValid) {
            // For testing purposes, create a new hash with the provided password
            // This helps debug if the hashing algorithm is consistent
            const testHash = await bcrypt.hash(plainPassword, 12);
            console.log('Test hash with provided password:', testHash);
            
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});