'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  company?: string;
  companyName: string;
  companyId?: {
    _id: string;
    name: string;
    email: string;
    userId: string;
  };
  location: string;
  description: string;
  requirements: string[];
  salary: Salary;
  jobType: string;
  type?: string; // Keep for backward compatibility
  status: 'pending' | 'active' | 'closed';
  postedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function JobManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch jobs based on status filter
  useEffect(() => {
    const fetchJobs = async () => {
      if (status === 'authenticated' && session?.user?.role === 'admin') {
        try {
          setLoading(true);
          setError(null);
          
          const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
          const response = await fetch(`/api/admin/jobs${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch jobs');
          }
          
          const data = await response.json();
          setJobs(data);
        } catch (err: any) {
          console.error('Error fetching jobs:', err);
          setError(err.message || 'Failed to load jobs');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchJobs();
  }, [status, session, statusFilter]);

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/auth/signin');
    return null;
  }

  // Handle job status update
  const updateJobStatus = async (jobId: string, newStatus: 'pending' | 'active' | 'closed') => {
    try {
      setActionLoading(jobId);
      setError(null);
      
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job status');
      }
      
      // Update local state
      setJobs(jobs.map(job => 
        job._id === jobId ? { ...job, status: newStatus } : job
      ));
      
      setSuccessMessage(`Job status updated to ${newStatus}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating job status:', err);
      setError(err.message || 'Failed to update job status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle job deletion
  const deleteJob = async (jobId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(jobId);
      setError(null);
      
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete job');
      }
      
      // Update local state
      setJobs(jobs.filter(job => job._id !== jobId));
      
      setSuccessMessage('Job deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting job:', err);
      setError(err.message || 'Failed to delete job');
    } finally {
      setActionLoading(null);
    }
  };

  // Helper function to format salary display
  const formatSalary = (salary: Salary) => {
    if (!salary || !salary.min || !salary.max) return 'Not specified';
    return `${salary.currency || 'USD'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  // Helper function to format status display
  const formatStatus = (status: Job['status']): string => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get job type display
  const getJobTypeDisplay = (type: string | undefined) => {
    if (!type) return 'Unknown';
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <Link 
              href="/admin" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </Link>
          </div>
          
          {/* Status Filter Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <Link
                href="/admin/jobs"
                className={`${
                  statusFilter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Jobs
              </Link>
              <Link
                href="/admin/jobs?status=pending"
                className={`${
                  statusFilter === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending Approval
              </Link>
              <Link
                href="/admin/jobs?status=active"
                className={`${
                  statusFilter === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Active
              </Link>
              <Link
                href="/admin/jobs?status=closed"
                className={`${
                  statusFilter === 'closed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Closed
              </Link>
            </nav>
          </div>
          
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
          
          {/* Jobs Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : jobs.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                No jobs found. {statusFilter !== 'all' && `Try changing the status filter.`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posted
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map(job => (
                      <tr key={job._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.companyName}</div>
                          <div className="text-sm text-gray-500">
                            {job.companyId?.name || job.postedBy?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getJobTypeDisplay(job.jobType || job.type)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatSalary(job.salary)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(job.status)}`}>
                            {formatStatus(job.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            {job.status === 'pending' && (
                              <button
                                onClick={() => updateJobStatus(job._id, 'active')}
                                disabled={actionLoading === job._id}
                                className="text-green-600 hover:text-green-900"
                              >
                                {actionLoading === job._id ? (
                                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                ) : 'Approve'}
                              </button>
                            )}
                            {job.status === 'active' && (
                              <button
                                onClick={() => updateJobStatus(job._id, 'closed')}
                                disabled={actionLoading === job._id}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                {actionLoading === job._id ? (
                                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                ) : 'Close'}
                              </button>
                            )}
                            {job.status === 'closed' && (
                              <button
                                onClick={() => updateJobStatus(job._id, 'active')}
                                disabled={actionLoading === job._id}
                                className="text-green-600 hover:text-green-900"
                              >
                                {actionLoading === job._id ? (
                                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                ) : 'Reopen'}
                              </button>
                            )}
                            <button
                              onClick={() => deleteJob(job._id)}
                              disabled={actionLoading === job._id}
                              className="text-red-600 hover:text-red-900"
                            >
                              {actionLoading === job._id ? (
                                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                              ) : 'Delete'}
                            </button>
                            <Link
                              href={`/admin/jobs/${job._id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/jobs/${job._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              target="_blank"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
