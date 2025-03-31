import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Company } from '@/models/Company';
import { resend } from '@/lib/resend';
import { dbConnect } from '@/lib/mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if company already exists for this user
    const existingCompany = await Company.findOne({ userId: session.user.id });
    if (existingCompany) {
      return NextResponse.json(
        { error: 'You already have a company profile' },
        { status: 400 }
      );
    }

    const data = await req.json();
    const company = await Company.create({
      ...data,
      userId: session.user.id,
      status: 'pending'
    });

    // Send email notification
    await resend.emails.send({
      from: 'Job Portal <noreply@jobportal.com>',
      to: [data.email],
      subject: 'Company Profile Under Review',
      html: `
        <h1>Your Company Profile is Under Review</h1>
        <p>Dear ${data.name},</p>
        <p>Thank you for submitting your company profile. Our team will review it shortly.</p>
        <p>You will receive another email once the review is complete.</p>
        <br/>
        <p>Best regards,</p>
        <p>Job Portal Team</p>
      `
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create company profile' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const companies = await Company.find(query);
    return NextResponse.json(companies);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
