import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Resend } from "resend";
import { User } from "@/models/User";
import { PasswordReset } from "@/models/PasswordReset";
import { generateToken } from "@/lib/auth-utils";

// Ensure database connection
async function ensureDbConnected() {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connection successful!");
  }
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// POST handler to request password reset
export async function POST(request: Request) {
  try {
    await ensureDbConnected();
    
    const { email } = await request.json();
    console.log(`Password reset requested for email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      // Don't reveal whether email exists to prevent enumeration
      return NextResponse.json({ message: "If an account exists with this email, you will receive a reset link" });
    }
    
    console.log(`User found: ${user._id} (${user.name})`);

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // Create or update password reset token
    const resetToken = await PasswordReset.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        token,
        expiresAt
      },
      { upsert: true, new: true }
    );
    
    console.log(`Reset token created: ${resetToken.token}`);

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password/${resetToken.token}`;
    console.log(`Reset URL: ${resetUrl}`);

    // Send reset email with HTML content instead of JSX
    try {
      console.log(`Attempting to send email to ${email} using Resend...`);
      
      const emailResponse = await resend.emails.send({
        from: "Job Portal <onboarding@resend.dev>", // Updated to use a valid Resend domain
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Password Reset Request</h1>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, please click the button below:</p>
            <a
              href="${resetUrl}"
              style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; display: block; text-align: center;"
            >
              Reset Password
            </a>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br/>The Job Portal Team</p>
          </div>
        `
      });
      
      console.log('Email sent successfully:', emailResponse);
    } catch (emailError: any) {
      console.error('Failed to send email:', emailError);
      console.error('Error details:', emailError.message);
      
      // We still return success to the client to prevent email enumeration
      // But we log the error for debugging
    }

    return NextResponse.json({ message: "If an account exists with this email, you will receive a reset link" });
  } catch (error: any) {
    console.error("Error requesting password reset:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to request password reset" },
      { status: 500 }
    );
  }
}
