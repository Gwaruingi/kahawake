import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { Application } from "@/models/Application";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to fetch application statistics
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
    
    // Count total applications
    const totalApplications = await Application.countDocuments();
    
    // Count pending applications
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    
    // Count reviewed applications
    const reviewedApplications = await Application.countDocuments({ status: 'reviewed' });
    
    // Count accepted applications
    const acceptedApplications = await Application.countDocuments({ status: 'accepted' });
    
    // Count rejected applications
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
    
    // Return statistics
    return NextResponse.json({
      totalApplications,
      pendingApplications,
      reviewedApplications,
      acceptedApplications,
      rejectedApplications
    });
  } catch (error) {
    console.error("Error fetching application statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch application statistics" },
      { status: 500 }
    );
  }
}
