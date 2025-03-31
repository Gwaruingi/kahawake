import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import { resend } from '@/lib/resend';
import { dbConnect } from '@/lib/mongoose';

// GET a single company by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    // Await the params properly
    const { id } = await params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      );
    }
    
    const company = await Company.findById(id).lean();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

// PATCH to update company status (for admin approval/rejection)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can update company status.' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    const { status, rejectionReason } = body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Await the params properly
    const { id } = await params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      );
    }
    
    // Use findOneAndUpdate to avoid validation issues
    const company = await Company.findOneAndUpdate(
      { _id: id },
      { status: status },
      { new: true }
    ).lean();
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Find the company owner using the userId
    let user = null;
    try {
      if (company.userId) {
        user = await User.findById(company.userId).lean();
      }
    } catch (userError) {
      console.error('Error finding user:', userError);
      // Continue even if user lookup fails
    }
    
    // Send email notification based on status
    if (user && user.email) {
      let emailSubject, emailHtml;
      
      if (status === 'approved') {
        emailSubject = 'Company Profile Approved';
        emailHtml = `
          <h1>Your Company Profile Has Been Approved!</h1>
          <p>Dear ${company.name},</p>
          <p>We're pleased to inform you that your company profile has been approved.</p>
          <p>You can now post jobs and start recruiting talented professionals.</p>
          <p><a href="${process.env.NEXTAUTH_URL}/company/dashboard">Go to your dashboard</a> to get started.</p>
          <br/>
          <p>Best regards,</p>
          <p>Job Portal Team</p>
        `;
      } else if (status === 'rejected') {
        emailSubject = 'Company Profile Needs Updates';
        emailHtml = `
          <h1>Your Company Profile Requires Updates</h1>
          <p>Dear ${company.name},</p>
          <p>We've reviewed your company profile and found that it requires some updates before it can be approved.</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Please <a href="${process.env.NEXTAUTH_URL}/company/profile/edit">update your profile</a> and resubmit for approval.</p>
          <br/>
          <p>Best regards,</p>
          <p>Job Portal Team</p>
        `;
      }
      
      if (emailSubject && emailHtml) {
        try {
          await resend.emails.send({
            from: 'Job Portal <noreply@jobportal.com>',
            to: [user.email],
            subject: emailSubject,
            html: emailHtml
          });
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Continue even if email fails
        }
      }
    }
    
    return NextResponse.json({ 
      message: `Company status updated to ${status}`,
      company 
    });
  } catch (error: any) {
    console.error('Error updating company status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update company status' },
      { status: 500 }
    );
  }
}
