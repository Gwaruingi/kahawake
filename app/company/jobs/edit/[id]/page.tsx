import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Company } from '@/models/Company';
import { Job } from '@/models/Job';
import { dbConnect } from '@/lib/mongoose';
import JobPostingForm from '@/components/jobs/JobPostingForm';

// In Next.js 15, params must be a Promise for dynamic routes in production builds
type EditJobPageProps = {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  // Get the current session
  const session = await auth();
  
  // Resolve the params Promise
  const resolvedParams = await params;
  
  // If not logged in or not a company, redirect to login
  if (!session?.user || session.user.role !== 'company') {
    return redirect('/auth/login?callbackUrl=/company/jobs/edit/' + resolvedParams.id);
  }
  
  // Connect to the database
  await dbConnect();
  
  // Check if the company has an approved profile
  const companyDoc = await Company.findOne({ 
    userId: session.user.id,
    status: 'approved'
  }).lean();
  
  // Type assertion to ensure TypeScript recognizes the company properties
  const company = companyDoc ? (companyDoc as unknown) as { 
    _id: { toString(): string }; 
    name: string; 
    userId?: string;
    status: string;
  } : null;
  
  if (!company) {
    return redirect('/company/profile');
  }
  
  // Get the job to edit
  const jobDoc = await Job.findById(resolvedParams.id).lean();
  
  // Type assertion to ensure TypeScript recognizes the job properties
  const job = jobDoc ? (jobDoc as unknown) as { 
    _id: { toString(): string }; 
    companyId: { toString(): string };
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    location: string;
    salary: string;
    jobType: string;
    status: string;
  } : null;
  
  // If job doesn't exist or doesn't belong to this company, redirect
  if (!job || job.companyId.toString() !== company._id.toString()) {
    return redirect('/company/jobs');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Job Posting</h1>
      <JobPostingForm job={job} />
    </div>
  );
}
