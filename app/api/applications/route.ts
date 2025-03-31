import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Application } from "@/models/Application";
import { Profile } from "@/models/Profile";
import { Job } from "@/models/Job";
import { auth } from "@/auth";
import { Resend } from 'resend';

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to fetch user's applications
export async function GET(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    // Build query
    const query: any = { userId: session.user.id };
    
    if (status) {
      query.status = status;
    }
    
    // Fetch applications with job details
    const applications = await Application.find(query)
      .populate({
        path: 'jobId',
        model: Job,
        select: 'title company location type status'
      })
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

// POST handler to create a new application
export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }
    
    // Check if job exists and is active
    const job = await Job.findById(data.jobId).lean();
    
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }
    
    if (job.status !== 'active') {
      return NextResponse.json(
        { error: "This job is no longer accepting applications" },
        { status: 400 }
      );
    }
    
    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      jobId: data.jobId,
      userId: session.user.id
    });
    
    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied for this job" },
        { status: 400 }
      );
    }
    
    // Get user profile
    const profile = await Profile.findOne({ email: session.user.email }).lean();
    
    if (!profile) {
      return NextResponse.json(
        { error: "Please complete your profile before applying" },
        { status: 400 }
      );
    }
    
    // Create application - resume is now optional
    const applicationData: any = {
      jobId: data.jobId,
      userId: session.user.id,
      name: profile.name,
      email: profile.email,
      status: 'pending'
    };
    
    // Add resume from profile if it exists
    if (profile.resume) {
      applicationData.resume = profile.resume;
    }
    
    // Add CV from application form if provided
    if (data.cv) {
      applicationData.cv = data.cv;
    }
    
    // Add cover letter if provided
    if (data.coverLetter) {
      applicationData.coverLetter = data.coverLetter;
    }
    
    // Validate that at least one document is provided (resume or CV)
    if (!applicationData.resume && !applicationData.cv) {
      return NextResponse.json(
        { error: "Either a resume or a CV is required to apply" },
        { status: 400 }
      );
    }
    
    // Create the application
    const application = await Application.create(applicationData);
    
    // Send email notification (if Resend API key is set)
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      try {
        await resend.emails.send({
          from: 'Job Portal <notifications@jobportal.com>',
          to: profile.email,
          subject: `Application Submitted: ${job.title} at ${job.company}`,
          html: `
            <h1>Application Submitted</h1>
            <p>Thank you for applying to the ${job.title} position at ${job.company}.</p>
            <p>Your application has been received and is currently under review.</p>
            <p>You can track the status of your application in your dashboard.</p>
          `
        });
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Continue even if email fails
      }
    }
    
    return NextResponse.json({
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
