'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    companyName: string;
    location: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  notificationRead: boolean;
  statusHistory?: Array<{
    status: string;
    date: string;
    notes?: string;
  }>;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedAppId = searchParams.get('application');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Fetch applications and notifications when component mounts
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchApplications();
      fetchNotifications();
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/dashboard');
    }
  }, [sessionStatus, router]);
  
  // Highlight application if ID is in URL
  useEffect(() => {
    if (highlightedAppId && applications.length > 0) {
      const app = applications.find(app => app._id === highlightedAppId);
      if (app) {
        setSelectedApplication(app);
        setIsHistoryModalOpen(true);
        
        // Mark application notification as read if it's not already
        if (!app.notificationRead) {
          markApplicationNotificationAsRead(app._id);
        }
      }
    }
  }, [highlightedAppId, applications]);
  
  // Fetch applications from API
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/applications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load your applications. Please try again later.');
      toast.error('Failed to load your applications');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Don't show error toast for notifications to avoid multiple errors
    }
  };
  
  // Mark application notification as read
  const markApplicationNotificationAsRead = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationRead: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app._id === applicationId ? { ...app, notificationRead: true } : app
        )
      );
    } catch (err) {
      console.error('Error marking application notification as read:', err);
    }
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: notificationId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };
  
  // Open history modal for an application
  const openHistoryModal = (application: Application) => {
    setSelectedApplication(application);
    setIsHistoryModalOpen(true);
    
    // Mark application notification as read if it's not already
    if (!application.notificationRead) {
      markApplicationNotificationAsRead(application._id);
    }
    
    // Update URL with application ID without refreshing the page
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('application', application._id);
    window.history.pushState({}, '', newUrl.toString());
  };
  
  // Close history modal
  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedApplication(null);
    
    // Remove application ID from URL without refreshing the page
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('application');
    window.history.pushState({}, '', newUrl.toString());
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'shortlisted':
        return 'bg-indigo-100 text-indigo-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // If session is loading, show loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Applications</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // If user is not authenticated, they will be redirected
  if (sessionStatus === 'unauthenticated') {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>
      
      {/* Notifications Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {notifications.slice(0, 5).map((notification) => (
              <div 
                key={notification._id} 
                className={`p-4 border-b ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {notification.type === 'application_status' && notification.relatedId && (
                      <button
                        onClick={() => {
                          const app = applications.find(a => a._id === notification.relatedId);
                          if (app) {
                            openHistoryModal(app);
                          }
                          if (!notification.read) {
                            markNotificationAsRead(notification._id);
                          }
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                      >
                        View Details
                      </button>
                    )}
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationAsRead(notification._id)}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {notifications.length > 5 && (
              <div className="p-3 text-center">
                <button 
                  onClick={() => {
                    // TODO: Implement a full notifications page
                    toast.success('Viewing all notifications will be available soon!');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Applications Table */}
      <h2 className="text-xl font-semibold mb-4">Job Applications</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
          <Link href="/jobs" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr 
                    key={application._id} 
                    className={!application.notificationRead ? 'bg-blue-50' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/jobs/${application.jobId._id}`} className="hover:text-blue-600">
                          {application.jobId.title}
                        </Link>
                      </div>
                      <div className="text-sm text-gray-500">{application.jobId.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.jobId.companyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                      {!application.notificationRead && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          New
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(application.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openHistoryModal(application)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      <Link href={`/jobs/${application.jobId._id}`} className="text-gray-600 hover:text-gray-900">
                        View Job
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Status History Modal */}
      {isHistoryModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl mx-auto max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Application Details
                </h3>
                <button
                  onClick={closeHistoryModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedApplication.jobId.title}
                </h4>
                <p className="text-gray-600">
                  {selectedApplication.jobId.companyName} • {selectedApplication.jobId.location}
                </p>
                <div className="mt-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  Status History
                </h4>
                {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 ? (
                  <div className="border-l-2 border-gray-200 pl-4 space-y-4">
                    {selectedApplication.statusHistory.map((history, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-blue-500"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Status changed to <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(history.status)}`}>
                              {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(history.date), 'MMM d, yyyy h:mm a')}
                          </p>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Note:</span> {history.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No status updates yet. Your application is still being processed.
                  </p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={closeHistoryModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
