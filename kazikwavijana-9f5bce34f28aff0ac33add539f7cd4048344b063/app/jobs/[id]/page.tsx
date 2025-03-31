'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  LinkIcon
} from '@heroicons/react/24/solid';

interface Job {
  _id: string;
  title: string;
  companyId: string;
  companyName: string;
  jobType: string;
  location: string;
  salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  applyMethod: {
    type: 'email' | 'link' | 'internal';
    email?: string;
    applyLink?: string;
  };
  applicationDeadline: string;
  status: 'active' | 'closed';
  createdAt: string;
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        const data = await response.json();
        setJob(data);
      } catch (err) {
        setError('Error loading job details. Please try again later.');
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  const isDeadlinePassed = () => {
    if (!job) return false;
    const deadline = new Date(job.applicationDeadline);
    const today = new Date();
    return deadline < today;
  };

  const handleApply = () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/jobs/${params.id}`)}`);
      return;
    }

    // Redirect to internal application form
    router.push(`/apply/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
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
              <p className="text-sm text-red-700">{error || 'Job not found'}</p>
            </div>
          </div>
        </div>
        <Link href="/jobs" className="text-blue-600 hover:text-blue-800">
          ← Back to all jobs
        </Link>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed();
  const isJobClosed = job.status === 'closed' || deadlinePassed;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Link href="/jobs" className="text-blue-600 hover:text-blue-800 mb-8 inline-block">
        ← Back to all jobs
      </Link>
      
      {isJobClosed && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {job.status === 'closed' 
                  ? 'This job posting has been closed by the employer.' 
                  : 'The application deadline for this job has passed.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{job.companyName} • {job.location}</p>
          </div>
          <div className="flex space-x-3 mt-2 md:mt-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {job.jobType}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              job.status === 'active' && !deadlinePassed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {job.status === 'active' && !deadlinePassed ? 'Active' : 'Closed'}
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center">
              <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Job Type: <span className="font-medium">{job.jobType}</span></span>
            </div>
            
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Location: <span className="font-medium">{job.location}</span></span>
            </div>
            
            {job.salary && (
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Salary: <span className="font-medium">{job.salary}</span></span>
              </div>
            )}
            
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">
                Application Deadline: <span className="font-medium">{new Date(job.applicationDeadline).toLocaleDateString()}</span>
                {deadlinePassed && <span className="text-red-500 ml-2">(Expired)</span>}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Job Description</h2>
            <div className="text-sm text-gray-500 whitespace-pre-line">
              {job.description}
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Responsibilities</h2>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              {job.responsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Requirements & Qualifications</h2>
            <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
              {job.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">How to Apply</h2>
            <div className="flex items-start text-sm text-gray-500">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                Apply directly through our job portal by clicking the "Apply Now" button below.
                {!session && !isJobClosed && (
                  <p className="mt-1 text-blue-600">
                    You'll need to sign in to submit your application.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleApply}
              disabled={isJobClosed}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isJobClosed
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isJobClosed ? 'Position Closed' : 'Apply Now'}
            </button>
            {!session && !isJobClosed && (
              <p className="mt-2 text-sm text-gray-500">
                You need to <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/jobs/${params.id}`)}`} className="text-blue-600 hover:text-blue-800">sign in</Link> to apply for this job.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
