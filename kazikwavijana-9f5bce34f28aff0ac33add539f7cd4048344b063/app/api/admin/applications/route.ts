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

// GET handler to fetch applications with optional status filter
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
    const status = url.searchParams.get('status');
    
    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    // Fetch applications with populated jobId and userId fields
    const applications = await Application.find(query)
      .populate('jobId', 'title company location type status')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
