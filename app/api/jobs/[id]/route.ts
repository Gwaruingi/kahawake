import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { Job } from "@/models/Job";
import { Company } from "@/models/Company";
import { 
  handleDbError, 
  handleValidationError, 
  handleAuthError, 
  handlePermissionError,
  handleNotFoundError
} from "@/lib/error-handler";
import { ensureDbConnected } from "@/lib/mongoose";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Ensure database connection
    await ensureDbConnected();
    
    // Validate the job ID
    const { id } = await params;
    if (!id) {
      return handleValidationError(
        new Error("Missing job ID"),
        "Job ID is required"
      );
    }
    
    // Fetch job by ID with retry logic for resilience
    let job;
    try {
      job = await Job.findById(id).lean();
    } catch (dbError: any) {
      // If it's a connection error, wait and retry
      if (dbError.name === 'MongoNetworkError' || 
          dbError.message?.includes('ECONNREFUSED') ||
          dbError.name === 'MongoServerSelectionError') {
        
        console.log("Database connection issue, retrying job fetch...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Second attempt
        job = await Job.findById(id).lean();
      } else {
        // If it's not a connection error, rethrow
        throw dbError;
      }
    }
    
    if (!job) {
      return handleNotFoundError(
        new Error(`Job with ID ${id} not found`),
        "Job not found"
      );
    }
    
    return NextResponse.json(job);
  } catch (error: any) {
    return handleDbError(error, "Failed to fetch job details");
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Ensure database connection
    await ensureDbConnected();
    
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated and is a company
    if (!session?.user || session.user.role !== 'company') {
      return handleAuthError(
        new Error("Only employers can update jobs"),
        "Unauthorized. Only employers can update jobs."
      );
    }
    
    // Get the job ID from params
    const { id } = await params;
    
    // Check if the company has an approved profile
    const company = await Company.findOne({ 
      userId: session.user.id,
      status: 'approved'
    }).lean();
    
    if (!company) {
      return handlePermissionError(
        new Error("No approved company profile"),
        "You need an approved company profile to update jobs."
      );
    }
    
    // Parse job data from request
    const jobData = await request.json();
    
    // Find the job to update
    const job = await Job.findById(id);
    
    if (!job) {
      return handleNotFoundError(
        new Error(`Job with ID ${id} not found`),
        "Job not found"
      );
    }
    
    // Check if the job belongs to the company
    if (job.companyId !== company._id.toString()) {
      return handlePermissionError(
        new Error("Job does not belong to this company"),
        "You can only update jobs posted by your company."
      );
    }
    
    // Update job fields
    Object.keys(jobData).forEach(key => {
      if (key !== '_id' && key !== 'companyId' && key !== 'companyName') {
        // @ts-ignore
        job[key] = jobData[key];
      }
    });
    
    // Save the updated job
    await job.save();
    
    return NextResponse.json({
      message: "Job updated successfully",
      job
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return handleValidationError(error, "Job validation failed");
    }
    
    // Handle other errors
    return handleDbError(error, "Failed to update job");
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Ensure database connection
    await ensureDbConnected();
    
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated and is a company
    if (!session?.user || session.user.role !== 'company') {
      return handleAuthError(
        new Error("Only employers can delete jobs"),
        "Unauthorized. Only employers can delete jobs."
      );
    }
    
    // Get the job ID from params
    const { id } = await params;
    
    // Check if the company has an approved profile
    const company = await Company.findOne({ 
      userId: session.user.id,
      status: 'approved'
    }).lean();
    
    if (!company) {
      return handlePermissionError(
        new Error("No approved company profile"),
        "You need an approved company profile to delete jobs."
      );
    }
    
    // Find the job to delete
    const job = await Job.findById(id);
    
    if (!job) {
      return handleNotFoundError(
        new Error(`Job with ID ${id} not found`),
        "Job not found"
      );
    }
    
    // Check if the job belongs to the company
    if (job.companyId !== company._id.toString()) {
      return handlePermissionError(
        new Error("Job does not belong to this company"),
        "You can only delete jobs posted by your company."
      );
    }
    
    // Delete the job
    await Job.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: "Job deleted successfully"
    });
  } catch (error: any) {
    return handleDbError(error, "Failed to delete job");
  }
}
