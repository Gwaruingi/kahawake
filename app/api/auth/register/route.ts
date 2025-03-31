import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["jobseeker", "company"]),
  companyName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const isTestUser = url.searchParams.get('createTestUser') === 'true';
    
    // Special case for creating a test user
    if (isTestUser) {
      console.log('Creating test user for authentication testing');
      
      // Check if test user already exists
      const existingTestUser = await User.findOne({ email: 'test@example.com' });
      
      if (existingTestUser) {
        // Delete existing test user to ensure we have a fresh one
        await User.deleteOne({ email: 'test@example.com' });
        console.log('Deleted existing test user');
      }
      
      // Create a test user with known credentials
      const testPassword = 'TestPassword123';
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      console.log('Test password:', testPassword);
      console.log('Hashed password:', hashedPassword);
      
      const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'jobseeker',
      });
      
      console.log('Test user created successfully:', testUser.email);
      
      return NextResponse.json({
        message: "Test user created successfully",
        email: 'test@example.com',
        password: testPassword,
      });
    }

    const { name, email, password, role, companyName } = registerSchema.parse(await request.json());

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      companyName: role === 'company' ? companyName : undefined,
    });

    // Send welcome email
    await resend.emails.send({
      from: 'Job Portal <noreply@jobportal.com>',
      to: [email],
      subject: role === 'company' 
        ? 'Welcome to Job Portal - Company Account Created'
        : 'Welcome to Job Portal',
      html: `
        <h1>Welcome to Job Portal</h1>
        <p>Dear ${name},</p>
        ${role === 'company' 
          ? `
            <p>Your company account has been created successfully.</p>
            <p>Please complete your company profile by clicking the link below:</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/company/profile">Complete Company Profile</a></p>
            <p>Once your company profile is approved, you can start posting jobs.</p>
          `
          : `
            <p>Your account has been created successfully.</p>
            <p>You can now start searching for jobs and applying to them.</p>
          `
        }
        <br/>
        <p>Best regards,</p>
        <p>Job Portal Team</p>
      `
    });

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
