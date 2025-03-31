import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Company } from '@/models/Company';
import { Job } from '@/models/Job';
import { dbConnect } from '@/lib/mongoose';
import JobPostingForm from '@/components/jobs/JobPostingForm';

export default async function EditJobPage({ params }: { params: { id: string } }) {
  // Get the current session
  const session = await auth();
  
  // If not logged in or not a company, redirect to login
  if (!session?.user || session.user.role !== 'company') {
    return redirect('/auth/login?callbackUrl=/company/jobs/edit/' + params.id);
  }
  
  // Connect to the database
  await dbConnect();
  
  // Check if the company has an approved profile
  const company = await Company.findOne({ 
    userId: session.user.id,
    status: 'approved'
  }).lean();
  
  if (!company) {
    return redirect('/company/profile');
  }
  
  // Get the job to edit
  const job = await Job.findById(params.id).lean();
  
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
