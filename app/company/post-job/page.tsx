import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Company } from '@/models/Company';
import { dbConnect } from '@/lib/mongoose';
import JobPostingForm from '@/components/jobs/JobPostingForm';

export default async function PostJobPage() {
  // Get the current session
  const session = await auth();
  
  // If not logged in or not a company, redirect to login
  if (!session?.user || session.user.role !== 'company') {
    redirect('/auth/login?callbackUrl=/company/post-job');
  }
  
  // Connect to the database
  await dbConnect();
  
  // Check if the company has an approved profile
  const company = await Company.findOne({ 
    userId: session.user.id,
    status: 'approved'
  }).lean();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Post a New Job</h1>
      
      {!company ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Your company profile is not approved yet.</strong> You need an approved company profile to post jobs.
              </p>
              <p className="mt-2 text-sm text-yellow-700">
                <a href="/company/profile" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                  Go to your company profile
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <JobPostingForm />
      )}
    </div>
  );
}
