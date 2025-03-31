'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CandidateProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [notification, setNotification] = useState({ 
    show: false, 
    type: '', 
    message: '' 
  });

  // Fetch profile data when session is available
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile/candidate');
      return;
    }
    
    fetchProfile();
  }, [session, status, router]);

  // Fetch profile data from API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (data.exists) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showNotification('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Save profile data
  const saveProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.profile);
        showNotification('success', data.message || 'Profile saved successfully');
      } else {
        showNotification('error', data.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 5000);
  };

  // If loading or not authenticated
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Candidate Profile</h1>
      
      {notification.show && (
        <div className={`mb-6 p-4 rounded-md ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-700' 
            : 'bg-red-50 border-red-400 text-red-700'
        }`}>
          {notification.message}
        </div>
      )}
      
      <ProfileForm 
        initialData={profile} 
        onSave={saveProfile} 
        userEmail={session?.user?.email || ''}
      />
    </div>
  );
}
