'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Salary {
  min: number;
  max: number;
  currency: string;
}

interface Job {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: string;
  jobType: string;
  status: 'active' | 'closed';
  applicationDeadline: string;
  createdAt: string;
}

interface Profile {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  resume?: string;
  skills: string[];
  education: any[];
  experience: any[];
}

export default function JobApplicationPage({ params }: { params: { jobId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [cvRequired, setCvRequired] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/apply/${params.jobId}`)}`);
      return;
    }

    // Only fetch data if authenticated
    if (status === 'authenticated') {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // Fetch job details
          const jobResponse = await fetch(`/api/jobs/${params.jobId}`);
          if (!jobResponse.ok) {
            throw new Error('Failed to fetch job details');
          }
          const jobData = await jobResponse.json();
          
          // Check if job is active
          if (jobData.status !== 'active') {
            router.push(`/jobs/${params.jobId}?error=closed`);
            return;
          }
          
          // Check if application deadline has passed
          const deadline = new Date(jobData.applicationDeadline);
          const today = new Date();
          if (deadline < today) {
            router.push(`/jobs/${params.jobId}?error=deadline`);
            return;
          }
          
          setJob(jobData);
          
          // Fetch user profile
          const profileResponse = await fetch('/api/profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.exists) {
              setProfile(profileData.profile);
              // Set CV as required if profile doesn't have a resume
              setCvRequired(!profileData.profile.resume);
            } else {
              // No profile found - redirect to profile page
              router.push(`/profile?redirect=${encodeURIComponent(`/apply/${params.jobId}`)}`);
              return;
            }
          } else {
            // Error fetching profile - redirect to profile page
            router.push(`/profile?redirect=${encodeURIComponent(`/apply/${params.jobId}`)}`);
            return;
          }
        } catch (err) {
          console.error('Error fetching data:', err);
          setError('Failed to load application data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [status, params.jobId, router]);

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      setCvFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !job) {
      return;
    }
    
    // Validate CV upload if required
    if (cvRequired && !cvFile) {
      setError('Please upload a CV to apply for this job since you don\'t have a resume in your profile.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Upload CV if provided
      let cvUrl = null;
      if (cvFile) {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('type', 'cv');
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload CV');
        }
        
        const uploadData = await uploadResponse.json();
        cvUrl = uploadData.filePath;
      }
      
      // Submit application
      const applicationData: any = {
        jobId: job._id,
      };
      
      if (cvUrl) {
        applicationData.cv = cvUrl;
      }
      
      if (coverLetter.trim()) {
        applicationData.coverLetter = coverLetter.trim();
      }
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
      
      setSuccess('Application submitted successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard?status=success');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Job not found or no longer available.</p>
            </div>
          </div>
        </div>
        <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
          ← Back to all jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Link href={`/jobs/${job._id}`} className="text-blue-600 hover:text-blue-800 mb-8 inline-block">
        ← Back to job details
      </Link>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{job.companyName} • {job.location}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Your Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                This information will be used from your profile.
              </p>
              
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                    {profile?.name || session?.user?.name || 'Not available'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-50">
                    {profile?.email || session?.user?.email || 'Not available'}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Resume from Profile</label>
                <div className="mt-1">
                  {profile?.resume ? (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-700">Resume available from your profile</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-sm text-gray-700">
                        No resume in your profile. <strong>You must upload a CV below to apply.</strong>
                      </span>
                      <Link href="/profile" className="ml-2 text-xs text-blue-600 hover:text-blue-800">
                        Update Profile
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
              
              <div className="mt-4">
                <label htmlFor="cv" className="block text-sm font-medium text-gray-700">
                  Upload CV {cvRequired ? '(Required)' : '(Optional)'}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="cv" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input id="cv" name="cv" type="file" className="sr-only" onChange={handleCvChange} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX up to 5MB
                    </p>
                  </div>
                </div>
                {cvFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected file: {cvFile.name}
                  </p>
                )}
              </div>
              
              <div className="mt-4">
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                  Cover Letter (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    rows={4}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Why are you interested in this position?"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-end">
                <Link
                  href={`/jobs/${job._id}`}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    submitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
