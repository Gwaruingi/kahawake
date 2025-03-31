import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { Job } from "@/models/Job";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to fetch jobs with optional status filter
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
    
    // Fetch jobs with populated company information
    const jobs = await Job.find(query)
      .populate({
        path: 'companyId',
        select: 'name email userId',
        model: 'Company'
      })
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST handler to create a new job (admin can create jobs on behalf of companies)
export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.company || !data.location || !data.description || !data.postedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create job
    const newJob = await Job.create({
      ...data,
      status: data.status || 'pending', // Default to pending if not specified
    });
    
    return NextResponse.json({
      message: "Job created successfully",
      job: newJob
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
