'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  status: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Application {
  _id: string;
  jobId: Job;
  userId: User;
  name: string;
  email: string;
  resume?: string;
  cv?: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationMonitoring() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch applications based on status filter
  useEffect(() => {
    const fetchApplications = async () => {
      if (status === 'authenticated' && session?.user?.role === 'admin') {
        try {
          setLoading(true);
          setError(null);
          
          const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
          const response = await fetch(`/api/admin/applications${queryParams}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch applications');
          }
          
          const data = await response.json();
          setApplications(data);
        } catch (err: any) {
          console.error('Error fetching applications:', err);
          setError(err.message || 'Failed to load applications');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchApplications();
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

  // Handle application status update
  const updateApplicationStatus = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    try {
      setActionLoading(applicationId);
      setError(null);
      
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update application status');
      }
      
      // Update local state
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      setSuccessMessage(`Application status updated to ${newStatus}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating application status:', err);
      setError(err.message || 'Failed to update application status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle application deletion
  const deleteApplication = async (applicationId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionLoading(applicationId);
      setError(null);
      
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete application');
      }
      
      // Update local state
      setApplications(applications.filter(app => app._id !== applicationId));
      
      setSuccessMessage('Application deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error deleting application:', err);
      setError(err.message || 'Failed to delete application');
    } finally {
      setActionLoading(null);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
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
            <h1 className="text-3xl font-bold text-gray-900">Application Monitoring</h1>
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
                href="/admin/applications"
                className={`${
                  statusFilter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Applications
              </Link>
              <Link
                href="/admin/applications?status=pending"
                className={`${
                  statusFilter === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending
              </Link>
              <Link
                href="/admin/applications?status=reviewed"
                className={`${
                  statusFilter === 'reviewed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Reviewed
              </Link>
              <Link
                href="/admin/applications?status=accepted"
                className={`${
                  statusFilter === 'accepted'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Accepted
              </Link>
              <Link
                href="/admin/applications?status=rejected"
                className={`${
                  statusFilter === 'rejected'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Rejected
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
          
          {/* Applications Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : applications.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                No applications found. {statusFilter !== 'all' && `Try changing the status filter.`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map(application => (
                      <tr key={application._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{application.jobId.title}</div>
                          <div className="text-sm text-gray-500">{application.jobId.company}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {application.resume && (
                              <a 
                                href={application.resume} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                View Resume
                              </a>
                            )}
                            {application.cv && (
                              <a 
                                href={application.cv} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                View CV
                              </a>
                            )}
                            {application.coverLetter && (
                              <button 
                                onClick={() => alert(application.coverLetter)}
                                className="text-blue-600 hover:text-blue-900 text-sm text-left"
                              >
                                View Cover Letter
                              </button>
                            )}
                            {!application.resume && !application.cv && !application.coverLetter && (
                              <span className="text-gray-500 text-sm">No documents</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(application.status)}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <div className="relative group">
                              <button className="text-blue-600 hover:text-blue-900">
                                Update Status
                              </button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                                {application.status !== 'pending' && (
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'pending')}
                                    disabled={actionLoading === application._id}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    Mark as Pending
                                  </button>
                                )}
                                {application.status !== 'reviewed' && (
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'reviewed')}
                                    disabled={actionLoading === application._id}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    Mark as Reviewed
                                  </button>
                                )}
                                {application.status !== 'accepted' && (
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'accepted')}
                                    disabled={actionLoading === application._id}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    Mark as Accepted
                                  </button>
                                )}
                                {application.status !== 'rejected' && (
                                  <button
                                    onClick={() => updateApplicationStatus(application._id, 'rejected')}
                                    disabled={actionLoading === application._id}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                  >
                                    Mark as Rejected
                                  </button>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => deleteApplication(application._id)}
                              disabled={actionLoading === application._id}
                              className="text-red-600 hover:text-red-900"
                            >
                              {actionLoading === application._id ? (
                                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                              ) : 'Delete'}
                            </button>
                            <Link
                              href={`/jobs/${application.jobId._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              target="_blank"
                            >
                              View Job
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
