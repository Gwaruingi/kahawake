import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { auth } from "@/auth";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to fetch users with optional role filter
export async function GET(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get query parameters
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    
    // Build query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    // Fetch users
    const users = await User.find(query)
      .select('name email role isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
