'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'company' | 'admin';
  companyName?: string;
  createdAt: string;
}

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

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin');
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Fetch user details
        const userResponse = await fetch(`/api/admin/users/${params.id}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }
        const userData = await userResponse.json();
        setUser(userData);

        // If user is a company, fetch company details
        if (userData.role === 'company') {
          try {
            const companyResponse = await fetch(`/api/companies?userId=${params.id}`);
            if (companyResponse.ok) {
              const companiesData = await companyResponse.json();
              if (companiesData && companiesData.length > 0) {
                setCompany(companiesData[0]);
              }
            }
          } catch (companyError) {
            console.error('Error fetching company details:', companyError);
            // Don't set an error here, as the user data is still valid
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, sessionStatus, router, params.id]);

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
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 mb-6">
          User not found
        </div>
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/admin/users" className="text-blue-600 hover:underline flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Users
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <p><span className="font-medium">Name:</span> {user.name}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p>
                  <span className="font-medium">Role:</span> 
                  <span className="capitalize ml-1">
                    {user.role === 'jobseeker' ? 'Job Seeker' : user.role}
                  </span>
                </p>
                {user.companyName && (
                  <p><span className="font-medium">Company Name:</span> {user.companyName}</p>
                )}
                <p>
                  <span className="font-medium">Joined:</span> 
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {user.role === 'company' && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Company Profile</h2>
              
              {company ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-full object-cover mr-4" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold mr-4">
                        {company.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{company.name}</h3>
                      <p className="text-gray-600">{company.industry} • {company.location}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p><span className="font-medium">Email:</span> {company.email}</p>
                      <p><span className="font-medium">Website:</span> <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></p>
                      <p><span className="font-medium">Size:</span> {company.size}</p>
                      <p><span className="font-medium">Founded:</span> {company.foundedYear}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Status:</span> 
                        {company.status === 'pending' && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {company.status === 'approved' && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                        {company.status === 'rejected' && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Rejected
                          </span>
                        )}
                      </p>
                      <p><span className="font-medium">Created:</span> {new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-700">{company.description}</p>
                  </div>
                  
                  <div className="mt-6">
                    <Link 
                      href={`/admin/companies/${company._id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Full Company Profile
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
                  <p>This user is registered as a company but hasn't created a company profile yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
