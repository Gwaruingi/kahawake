import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { PasswordReset } from "@/models/PasswordReset";
import { User } from "@/models/User";
import { Resend } from "resend";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// POST handler to reset password
export async function POST(request: Request) {
  try {
    await ensureDbConnected();
    
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }
    
    console.log(`Processing password reset for token: ${token}`);
    
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
    
    // Find user
    const user = await User.findById(resetToken.userId);
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log(`Password updated for user: ${user._id}`);
    
    // Delete reset token
    await PasswordReset.findByIdAndDelete(resetToken._id);
    console.log('Reset token deleted');
    
    // Send confirmation email
    try {
      console.log(`Sending password change confirmation email to ${user.email}`);
      
      await resend.emails.send({
        from: "Job Portal <onboarding@resend.dev>",
        to: user.email,
        subject: "Your Password Has Been Reset",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Password Reset Successful</h1>
            <p>Hello ${user.name},</p>
            <p>Your password has been successfully reset. If you did not make this change, please contact our support team immediately.</p>
            <p>Best regards,<br/>The Job Portal Team</p>
          </div>
        `
      });
      
      console.log('Password change confirmation email sent');
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Failed to send confirmation email:', emailError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
