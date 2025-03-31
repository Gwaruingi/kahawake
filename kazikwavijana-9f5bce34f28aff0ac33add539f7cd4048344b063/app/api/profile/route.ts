import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Profile } from "@/models/Profile";
import { auth } from "@/auth";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Mongoose connected successfully");
  }
}

// GET handler to fetch user profile
export async function GET(request: Request) {
  try {
    // Get the current session using the auth() function
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Find the profile by userId
    const profile = await Profile.findOne({ 
      email: session.user.email 
    });
    
    if (!profile) {
      return NextResponse.json({ 
        message: "Profile not found", 
        exists: false 
      });
    }
    
    return NextResponse.json({ profile, exists: true });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST handler to create/update user profile
export async function POST(request: Request) {
  try {
    // Get the current session using the auth() function
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure database connection
    await ensureDbConnected();
    
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    
    // Find existing profile or create new one
    const existingProfile = await Profile.findOne({ 
      email: session.user.email 
    });
    
    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await Profile.findByIdAndUpdate(
        existingProfile._id,
        {
          ...data,
          email: session.user.email, // Ensure email matches session
        },
        { new: true }
      );
      
      return NextResponse.json({
        message: "Profile updated successfully",
        profile: updatedProfile
      });
    } else {
      // Create new profile
      const newProfile = await Profile.create({
        ...data,
        email: session.user.email,
        userId: session.user.id || new mongoose.Types.ObjectId()
      });
      
      return NextResponse.json({
        message: "Profile created successfully",
        profile: newProfile
      });
    }
  } catch (error) {
    console.error("Error saving profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}
