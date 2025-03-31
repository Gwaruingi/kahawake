'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

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

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin');
      return;
    }

    const fetchCompany = async () => {
      try {
        const response = await fetch(`/api/companies/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch company details');
        }
        const data = await response.json();
        setCompany(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [session, sessionStatus, router, params.id]);

  const updateCompanyStatus = async (status: 'approved' | 'rejected') => {
    try {
      setStatusLoading(true);
      
      const payload: { status: string; rejectionReason?: string } = { status };
      
      if (status === 'rejected' && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }
      
      const response = await fetch(`/api/companies/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company status');
      }

      const data = await response.json();
      setCompany(data.company);
      setShowRejectionForm(false);
      setRejectionReason('');
      
      // Show success message
      alert(`Company ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  };

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
        <Link href="/admin/companies" className="text-blue-600 hover:underline">
          Back to Companies
        </Link>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
          Company not found
        </div>
        <Link href="/admin/companies" className="text-blue-600 hover:underline">
          Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin/companies" className="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Companies
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-full object-cover mr-4" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
                  {company.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <p className="text-gray-600">{company.industry} • {company.location}</p>
              </div>
            </div>
            <div>
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
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Company Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {company.email}</p>
                <p><span className="font-medium">Website:</span> <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></p>
                <p><span className="font-medium">Size:</span> {company.size}</p>
                <p><span className="font-medium">Founded:</span> {company.foundedYear}</p>
                <p><span className="font-medium">Created:</span> {new Date(company.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{company.description}</p>
            </div>
          </div>

          {company.status === 'pending' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Review Company Profile</h2>
              
              {showRejectionForm ? (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (will be sent to the company)
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                  />
                  <div className="mt-3 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectionForm(false)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCompanyStatus('rejected')}
                      disabled={statusLoading || !rejectionReason.trim()}
                      className="px-3 py-1 bg-red-600 text-white rounded-md text-sm disabled:opacity-50"
                    >
                      {statusLoading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => updateCompanyStatus('approved')}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {statusLoading ? 'Processing...' : 'Approve Company'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectionForm(true)}
                    disabled={statusLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Company
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
