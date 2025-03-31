import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { PasswordReset } from "@/models/PasswordReset";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// GET handler to verify a password reset token
export async function GET(request: Request) {
  try {
    await ensureDbConnected();
    
    // Get token from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }
    
    console.log(`Verifying token: ${token}`);
    
    // Find token in database
    const resetToken = await PasswordReset.findOne({ token });
    
    if (!resetToken) {
      console.log('Token not found in database');
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 400 }
      );
    }
    
    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      console.log('Token has expired');
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }
    
    console.log('Token is valid');
    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Error verifying token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
