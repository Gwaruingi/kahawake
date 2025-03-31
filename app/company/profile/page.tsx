'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CompanyProfileForm from '@/components/company/CompanyProfileForm';
import { toast } from '@/components/ui/toast';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CompanyProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    const checkCompanyProfile = async () => {
      // Wait for session to be loaded
      if (status === 'loading') return;
      
      // Redirect to login if not authenticated
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      
      try {
        const response = await fetch(`/api/companies?userId=${session.user.id}`);
        if (response.ok) {
          const companies = await response.json();
          if (companies.length > 0) {
            setHasCompany(true);
            router.push('/company/dashboard');
          }
        }
      } catch (error) {
        toast.error('Failed to check company profile');
      } finally {
        setLoading(false);
      }
    };

    checkCompanyProfile();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  if (hasCompany) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Company Profile</h1>
      <CompanyProfileForm />
    </div>
  );
}
