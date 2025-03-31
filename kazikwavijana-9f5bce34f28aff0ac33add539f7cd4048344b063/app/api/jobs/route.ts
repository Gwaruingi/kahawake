import { NextResponse } from "next/server";
import { Job } from "@/models/Job";
import { Company } from "@/models/Company";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongoose";
import { 
  handleDbError, 
  handleValidationError, 
  handleAuthError, 
  handlePermissionError 
} from "@/lib/error-handler";

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    // Get the current session
    const session = await auth();
    
    // Get query parameters
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const jobType = url.searchParams.get('jobType');
    const status = url.searchParams.get('status') || 'active';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    
    // If user is a company, they should only see their own jobs
    if (session?.user?.role === 'company') {
      // Find the company associated with the current user
      const userCompany = await Company.findOne({ userId: session.user.id }).lean();
      
      if (!userCompany) {
        return NextResponse.json({
          jobs: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0
          }
        });
      }
      
      // Override any companyId parameter to ensure they only see their own jobs
      query.companyId = userCompany._id.toString();
    } else if (companyId) {
      // For non-company users, respect the companyId filter if provided
      query.companyId = companyId;
    }
    
    if (jobType) {
      query.jobType = jobType;
    }
    
    if (status !== 'all') {
      query.status = status;
    }
    
    // Fetch jobs with retry logic for resilience
    let jobs;
    let total;
    
    try {
      jobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Get total count for pagination
      total = await Job.countDocuments(query);
    } catch (dbError) {
      console.error("Database error in job listing, retrying:", dbError);
      
      // Wait a moment before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry once more
      jobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      total = await Job.countDocuments(query);
    }
    
    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return handleDbError(error, "Failed to fetch jobs");
  }
}

export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated and is a company
    if (!session?.user || session.user.role !== 'company') {
      return handleAuthError(
        new Error("Only employers can post jobs"),
        "Unauthorized. Only employers can post jobs."
      );
    }
    
    await dbConnect();
    
    // Check if the company has an approved profile
    const company = await Company.findOne({ 
      userId: session.user.id,
      status: 'approved'
    }).lean();
    
    if (!company) {
      return handlePermissionError(
        new Error("No approved company profile"),
        "You need an approved company profile to post jobs."
      );
    }
    
    // Parse job data from request
    const jobData = await request.json();
    
    // Add company information
    jobData.companyId = company._id ? company._id.toString() : '';
    jobData.companyName = company.name || '';
    
    // Set status to active (auto-approval)
    jobData.status = 'active';
    
    // Create job with retry logic for resilience
    let job;
    try {
      // First attempt
      job = await Job.create(jobData);
    } catch (dbError: any) {
      // If it's a connection error, wait and retry
      if (dbError.name === 'MongoNetworkError' || 
          dbError.message?.includes('ECONNREFUSED') ||
          dbError.name === 'MongoServerSelectionError') {
        
        console.log("Database connection issue, retrying job creation...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Second attempt
        job = await Job.create(jobData);
      } else {
        // If it's not a connection error, rethrow
        throw dbError;
      }
    }
    
    return NextResponse.json({
      message: "Job posted successfully",
      job
    }, { status: 201 });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return handleValidationError(error, "Job validation failed");
    }
    
    // Handle other errors
    return handleDbError(error, "Failed to post job");
  }
}
