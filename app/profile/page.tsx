'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      // User is not authenticated, redirect to sign in
      const callbackUrl = encodeURIComponent('/profile/candidate');
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }
    
    // User is authenticated, redirect to candidate profile
    setIsRedirecting(true);
    router.push('/profile/candidate');
  }, [session, status, router]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <LoadingSpinner />
      {isRedirecting && (
        <p className="mt-4 text-gray-600">Redirecting to your profile...</p>
      )}
    </div>
  );
}
