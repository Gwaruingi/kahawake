import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { Application } from "@/models/Application";
import { Job } from "@/models/Job";
import { Company } from "@/models/Company";
import { Notification } from "@/models/Notification";
import { 
  handleDbError, 
  handleValidationError, 
  handleAuthError, 
  handlePermissionError,
  handleNotFoundError
} from "@/lib/error-handler";
import { ensureDbConnected } from "@/lib/mongoose";
import { Resend } from 'resend';

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET handler to fetch a specific application
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Ensure database connection
    await ensureDbConnected();
    
    // Get the current session
    const session = await auth();
    
    if (!session?.user) {
      return handleAuthError(
        new Error("Authentication required"),
        "You must be logged in to view application details"
      );
    }
    
    // Validate the application ID
    const { id } = await params;
    if (!id) {
      return handleValidationError(
        new Error("Missing application ID"),
        "Application ID is required"
      );
    }
    
    // Fetch the application with job details
    const applicationDoc = await Application.findById(id)
      .populate({
        path: 'jobId',
        model: Job,
        select: 'title companyName companyId location jobType status'
      })
      .lean();
    
    if (!applicationDoc) {
      return handleNotFoundError(
        new Error(`Application with ID ${id} not found`),
        "Application not found"
      );
    }
    
    // First cast to unknown to avoid type errors
    const application = applicationDoc as unknown;
    
    // Then cast to the expected type
    const typedApplication = application as {
      userId: { toString(): string };
      jobId: { 
        companyId: string | mongoose.Types.ObjectId;
        _id: string;
        title: string;
        companyName: string;
        status: string;
      };
      status: string;
      notificationRead: boolean;
      _id: string;
      [key: string]: any;
    };
    
    // Check if the user is authorized to view this application
    if (session.user.role === 'jobseeker') {
      // Job seekers can only view their own applications
      if (typedApplication.userId.toString() !== session.user.id) {
        return handlePermissionError(
          new Error("Not authorized to view this application"),
          "You can only view your own applications"
        );
      }
      
      // If this is a job seeker viewing their own application, mark notification as read
      if (!typedApplication.notificationRead) {
        await Application.findByIdAndUpdate(id, { notificationRead: true });
      }
    } else if (session.user.role === 'company') {
      // Companies can only view applications for their jobs
      // Find the company profile
      const company = await Company.findOne({ 
        userId: session.user.id,
        status: 'approved'
      }).lean();
      
      if (!company) {
        return handlePermissionError(
          new Error("No approved company profile"),
          "You need an approved company profile to view applications"
        );
      }
      
      // Check if the job belongs to this company
      if (typedApplication.jobId.companyId.toString() !== company._id.toString()) {
        return handlePermissionError(
          new Error("Not authorized to view this application"),
          "You can only view applications for your company's jobs"
        );
      }
    } else {
      // Admin users can view all applications
      if (session.user.role !== 'admin') {
        return handlePermissionError(
          new Error("Not authorized to view this application"),
          "You do not have permission to view this application"
        );
      }
    }
    
    return NextResponse.json(typedApplication);
  } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('An error occurred');
      
    return handleDbError(errorObj, "Failed to fetch application details");
  
    }
}

// PATCH handler to update an application
export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    // Ensure database connection
    await ensureDbConnected();
    
    // Get the current session
    const session = await auth();
    
    if (!session?.user) {
      return handleAuthError(
        new Error("Authentication required"),
        "You must be logged in to update an application"
      );
    }
    
    // Get the application ID from params
    const { id } = await params;
    
    // Validate the application ID
    if (!id) {
      return handleValidationError(
        new Error("Missing application ID"),
        "Application ID is required"
      );
    }
    
    // Parse the request body
    const updateData = await request.json();
    
    // Validate the update data
    if (Object.keys(updateData).length === 0) {
      return handleValidationError(
        new Error("No update data provided"),
        "Please provide data to update"
      );
    }
    
    // Fetch the application with job details
    const applicationDoc = await Application.findById(id)
      .populate({
        path: 'jobId',
        model: Job,
        select: 'title companyName companyId location jobType status'
      });
    
    if (!applicationDoc) {
      return handleNotFoundError(
        new Error(`Application with ID ${id} not found`),
        "Application not found"
      );
    }
    
    // First cast to unknown to avoid type errors
    const application = applicationDoc as unknown;
    
    // Then cast to the expected type
    const typedApplication = application as {
      userId: { toString(): string };
      jobId: { 
        companyId: string | mongoose.Types.ObjectId;
        _id: string;
        title: string;
        companyName: string;
        status: string;
      };
      status: string;
      statusHistory?: Array<{
        status: string;
        date: Date;
        notes?: string;
      }>;
      notificationRead: boolean;
      email: string;
      name: string;
      _id: string;
      save: () => Promise<any>;
      [key: string]: any;
    };
    
    // Check authorization based on user role
    if (session.user.role === 'company') {
      // Companies can only update applications for their jobs
      // Find the company profile
      const company = await Company.findOne({ 
        userId: session.user.id,
        status: 'approved'
      }).lean();
      
      if (!company) {
        return handlePermissionError(
          new Error("No approved company profile"),
          "You need an approved company profile to update applications"
        );
      }
      
      // Check if the job belongs to this company
      if (typedApplication.jobId.companyId.toString() !== company._id.toString()) {
        return handlePermissionError(
          new Error("Not authorized to update this application"),
          "You can only update applications for your company's jobs"
        );
      }
      
      // Companies can only update status and notes
      const allowedFields = ['status', 'notes'];
      const updateFields: any = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });
      
      // If status is being updated, add to status history
      if (updateData.status && updateData.status !== typedApplication.status) {
        // Create a status history entry
        const historyEntry = {
          status: updateData.status,
          date: new Date(),
          notes: updateData.notes || undefined
        };
        
        // Initialize status history array if it doesn't exist
        if (!typedApplication.statusHistory) {
          typedApplication.statusHistory = [];
        }
        
        // Add the new status to history
        typedApplication.statusHistory.push(historyEntry);
        
        // Set notification flag for user
        typedApplication.notificationRead = false;
        
        // Create an internal notification for the user
        const statusMessages = {
          reviewed: "Your application has been reviewed",
          shortlisted: "Congratulations! You've been shortlisted",
          interview: "Congratulations! You've been selected for an interview",
          hired: "Congratulations! You've been hired",
          rejected: "Thank you for your interest, but your application was not selected"
        };
        
        const statusTitle = statusMessages[updateData.status as keyof typeof statusMessages] || 
                           `Your application status has been updated to ${updateData.status}`;
        
        await Notification.create({
          userId: typedApplication.userId.toString(),
          type: 'application_status',
          title: `Application Status Update: ${statusTitle}`,
          message: `Your application for ${typedApplication.jobId.title} at ${typedApplication.jobId.companyName} has been updated to "${updateData.status}".`,
          read: false,
          relatedId: typedApplication._id.toString()
        });
      }
      
      // Update the application
      Object.assign(typedApplication, updateFields);
      
      // Save the updated application
      await typedApplication.save();
      
      // Send email notification to the applicant if status changed
      if (updateData.status && updateData.status !== typedApplication.status && process.env.RESEND_API_KEY) {
        try {
          const statusMessages = {
            reviewed: "Your application has been reviewed",
            shortlisted: "Congratulations! You've been shortlisted",
            interview: "Congratulations! You've been selected for an interview",
            hired: "Congratulations! You've been hired",
            rejected: "Thank you for your interest, but your application was not selected"
          };
          
          const statusTitle = statusMessages[updateData.status as keyof typeof statusMessages] || 
                             `Your application status has been updated to ${updateData.status}`;
          
          await resend.emails.send({
            from: 'Job Portal <notifications@jobportal.com>',
            to: typedApplication.email,
            subject: `Application Update: ${statusTitle} for ${typedApplication.jobId.title}`,
            html: `
              <h1>Application Status Update</h1>
              <p>Dear ${typedApplication.name},</p>
              <p>${statusTitle} for the <strong>${typedApplication.jobId.title}</strong> position at <strong>${typedApplication.jobId.companyName}</strong>.</p>
              ${updateData.status === 'hired' ? 
                `<p>The employer will contact you soon with next steps.</p>` : 
                `<p>You can check your application status in your dashboard.</p>`
              }
              ${updateData.notes ? 
                `<p><strong>Feedback from the employer:</strong></p>
                <p>${updateData.notes}</p>` : 
                ''
              }
              <p>Thank you for using our platform!</p>
            `
          });
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Continue even if email fails
        }
      }
    } else if (session.user.role === 'jobseeker') {
      // Job seekers can only update their own applications
      if (typedApplication.userId.toString() !== session.user.id) {
        return handlePermissionError(
          new Error("Not authorized to update this application"),
          "You can only update your own applications"
        );
      }
      
      // Job seekers can only withdraw their applications or mark notifications as read
      const allowedFields = ['notificationRead'];
      const updateFields: any = {};
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });
      
      // Update the application
      Object.assign(typedApplication, updateFields);
      
      // Save the updated application
      await typedApplication.save();
    } else {
      // Admin users can update all applications
      if (session.user.role !== 'admin') {
        return handlePermissionError(
          new Error("Not authorized to update this application"),
          "You do not have permission to update this application"
        );
      }
      
      // Update the application with all provided fields
      Object.assign(typedApplication, updateData);
      
      // Save the updated application
      await typedApplication.save();
    }
    
    return NextResponse.json({
      message: "Application updated successfully",
      application: typedApplication
    });
  } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('An error occurred');
      
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return handleValidationError(errorObj, "Application validation failed");
    
    }
    
    // Handle other errors
    return handleDbError(errorObj, "Failed to update application");
  }
}
