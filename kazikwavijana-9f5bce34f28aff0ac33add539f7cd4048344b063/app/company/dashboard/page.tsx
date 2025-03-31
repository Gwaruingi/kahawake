'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BriefcaseIcon, 
  ClockIcon, 
  UsersIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';

interface Company {
  _id: string;
  name: string;
  email: string;
  logo: string;
  website: string;
  description: string;
  location: string;
  industry: string;
  size: string;
  foundedYear: number;
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  _id: string;
  title: string;
  companyName: string;
  jobType: string;
  location: string;
  status: string;
  createdAt: string;
  applicationDeadline: string;
}

interface JobStats {
  total: number;
  active: number;
  closed: number;
}

export default function CompanyDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0,
    active: 0,
    closed: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (sessionStatus === 'loading') return;
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch(`/api/companies?userId=${session.user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch company profile');
        }

        const companies = await response.json();
        
        if (companies.length === 0) {
          // No company profile found, redirect to create one
          router.push('/company/profile');
          return;
        }
        
        setCompany(companies[0]);
        
        // If company is approved, fetch recent jobs and job stats
        if (companies[0].status === 'approved') {
          try {
            // Fetch recent jobs
            const jobsResponse = await fetch(`/api/jobs?companyId=${companies[0]._id}&limit=5`);
            if (jobsResponse.ok) {
              const jobsData = await jobsResponse.json();
              setRecentJobs(jobsData.jobs || []);
            }
            
            // Fetch active jobs count
            const activeJobsResponse = await fetch(`/api/jobs?companyId=${companies[0]._id}&status=active&limit=1`);
            if (activeJobsResponse.ok) {
              const activeJobsData = await activeJobsResponse.json();
              
              // Fetch closed jobs count
              const closedJobsResponse = await fetch(`/api/jobs?companyId=${companies[0]._id}&status=closed&limit=1`);
              if (closedJobsResponse.ok) {
                const closedJobsData = await closedJobsResponse.json();
                
                // Set job stats
                setJobStats({
                  total: (activeJobsData.pagination?.total || 0) + (closedJobsData.pagination?.total || 0),
                  active: activeJobsData.pagination?.total || 0,
                  closed: closedJobsData.pagination?.total || 0
                });
              }
            }
          } catch (jobError) {
            console.error('Error fetching jobs:', jobError);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [session, sessionStatus, router]);

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          {error}
        </div>
        <Link href="/company/profile" className="text-blue-600 hover:underline">
          Go to Company Profile
        </Link>
      </div>
    );
  }

  if (!company) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Company Dashboard</h1>
            {company.status === 'pending' && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Pending Approval
              </span>
            )}
            {company.status === 'approved' && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Approved
              </span>
            )}
            {company.status === 'rejected' && (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Rejected
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name} 
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{company.name}</h2>
                    <p className="text-gray-600">{company.industry}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Location:</span> {company.location}</p>
                  <p className="text-sm"><span className="font-medium">Size:</span> {company.size}</p>
                  <p className="text-sm"><span className="font-medium">Founded:</span> {company.foundedYear}</p>
                  <p className="text-sm"><span className="font-medium">Website:</span> <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></p>
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              {company.status === 'pending' ? (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                  <h3 className="font-bold text-yellow-800 mb-2">Profile Under Review</h3>
                  <p className="text-yellow-800">
                    Your company profile is currently being reviewed by our team. 
                    You'll be notified once it's approved. You can post jobs after approval.
                  </p>
                </div>
              ) : company.status === 'rejected' ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                  <h3 className="font-bold text-red-800 mb-2">Profile Rejected</h3>
                  <p className="text-red-800">
                    Your company profile has been rejected. Please update your profile 
                    with accurate information and submit again.
                  </p>
                  <Link href="/company/profile/edit" className="mt-2 inline-block text-red-800 font-medium hover:underline">
                    Edit Profile
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-green-800 mb-2">Profile Approved</h3>
                    <p className="text-green-800">
                      Your company profile has been approved. You can now post jobs and manage applications.
                    </p>
                  </div>
                  
                  {/* Job Statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center">
                      <div className="bg-blue-100 p-3 rounded-full mr-3">
                        <BriefcaseIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Total Jobs</p>
                        <p className="text-2xl font-bold text-blue-800">{jobStats.total}</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center">
                      <div className="bg-green-100 p-3 rounded-full mr-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600">Active Jobs</p>
                        <p className="text-2xl font-bold text-green-800">{jobStats.active}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg flex items-center">
                      <div className="bg-gray-100 p-3 rounded-full mr-3">
                        <XCircleIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Closed Jobs</p>
                        <p className="text-2xl font-bold text-gray-800">{jobStats.closed}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Link href="/company/post-job" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition">
                      <h3 className="font-bold mb-1">Post a New Job</h3>
                      <p className="text-sm text-blue-100">Create a new job listing</p>
                    </Link>
                    
                    <Link href="/company/jobs" className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition">
                      <h3 className="font-bold mb-1">Manage Jobs</h3>
                      <p className="text-sm text-indigo-100">View and edit your job listings</p>
                    </Link>
                  </div>
                  
                  <div className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition">
                    <Link href="/company/applications" className="block">
                      <h3 className="font-bold mb-1">Manage Applications</h3>
                      <p className="text-sm text-green-100">Review and respond to job applications</p>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      {company.status === 'approved' && (
        <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Job Postings</h2>
              <Link href="/company/jobs" className="text-blue-600 hover:underline text-sm">
                View All Jobs
              </Link>
            </div>
          </div>
          
          {recentJobs.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
              <Link href="/company/post-job">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                  Post Your First Job
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {recentJobs.map((job) => (
                <div key={job._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/jobs/${job._id}`} className="text-lg font-medium text-blue-600 hover:underline">
                      {job.title}
                    </Link>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                    <div className="flex items-center">
                      <BriefcaseIcon className="h-4 w-4 mr-1" />
                      {job.jobType}
                    </div>
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      Posted on {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    <div className="space-x-2">
                      <Link href={`/company/jobs/edit/${job._id}`} className="text-xs text-indigo-600 hover:underline">
                        Edit
                      </Link>
                      <Link href={`/jobs/${job._id}`} className="text-xs text-blue-600 hover:underline">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
