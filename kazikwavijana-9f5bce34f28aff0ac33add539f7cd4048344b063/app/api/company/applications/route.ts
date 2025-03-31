import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";
import { Company } from "@/models/Company";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/mongoose";
import { 
  handleDbError, 
  handleValidationError, 
  handleAuthError, 
  handlePermissionError,
  handleNotFoundError
} from "@/lib/error-handler";

// GET handler to fetch applications for a company's jobs
export async function GET(request: Request) {
  try {
    // Ensure database connection
    await dbConnect();
    
    // Get the current session
    const session = await auth();
    
    // Check if user is authenticated and is a company
    if (!session?.user || session.user.role !== 'company') {
      return handleAuthError(
        new Error("Only employers can view job applications"),
        "Unauthorized. Only employers can view job applications."
      );
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const jobId = url.searchParams.get('jobId');
    
    // Find the company profile for the current user
    const company = await Company.findOne({ 
      userId: session.user.id,
      status: 'approved'
    }).lean();
    
    if (!company) {
      return handlePermissionError(
        new Error("No approved company profile"),
        "You need an approved company profile to view applications."
      );
    }
    
    // Find all jobs posted by this company
    const companyJobs = await Job.find({ companyId: company._id }).lean();
    
    if (companyJobs.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get all job IDs
    const jobIds = companyJobs.map(job => job._id);
    
    // Build query for applications
    const query: any = { jobId: { $in: jobIds } };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add job filter if provided
    if (jobId && jobId !== 'all') {
      // Verify that the job belongs to this company
      const jobBelongsToCompany = jobIds.some(id => id.toString() === jobId);
      
      if (!jobBelongsToCompany) {
        return handlePermissionError(
          new Error("Job does not belong to this company"),
          "You can only view applications for jobs posted by your company."
        );
      }
      
      query.jobId = jobId;
    }
    
    // Fetch applications with job and user details
    const applications = await Application.find(query)
      .populate({
        path: 'jobId',
        model: Job,
        select: 'title companyName location jobType'
      })
      .populate({
        path: 'userId',
        select: 'name email'
      })
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(applications);
  } catch (error: any) {
    return handleDbError(error, "Failed to fetch applications");
  }
}
