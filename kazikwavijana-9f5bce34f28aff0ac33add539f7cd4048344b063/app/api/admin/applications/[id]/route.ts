import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { Application } from "@/models/Application";
import { ensureDbConnected } from "@/lib/mongoose";

// GET handler to fetch a specific application
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Validate ID
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }
    
    // Fetch application
    const application = await Application.findById(id)
      .populate('jobId', 'title company location type status')
      .populate('userId', 'name email')
      .lean();
    
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    
    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PATCH handler to update an application status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get application ID
    const { id } = await params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate status
    if (data.status && !['pending', 'reviewed', 'shortlisted', 'interview', 'hired', 'rejected', 'accepted'].includes(data.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }
    
    // Check if application exists
    const application = await Application.findById(id);
    
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    
    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    )
    .populate('jobId', 'title company location type status')
    .populate('userId', 'name email')
    .lean();
    
    return NextResponse.json({
      message: "Application updated successfully",
      application: updatedApplication
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE handler to remove an application
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth();
    
    // Check if user is admin
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Get application ID
    const { id } = await params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }
    
    // Check if application exists
    const application = await Application.findById(id);
    
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }
    
    // Delete application
    await Application.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: "Application deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
