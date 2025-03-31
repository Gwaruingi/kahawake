import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { User } from "@/models/User";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to fetch user statistics
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
    
    // Count total users
    const totalUsers = await User.countDocuments();
    
    // Count job seekers
    const jobSeekers = await User.countDocuments({ role: 'jobseeker' });
    
    // Count companies
    const companies = await User.countDocuments({ role: 'company' });
    
    // Return statistics
    return NextResponse.json({
      totalUsers,
      jobSeekers,
      companies
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}
