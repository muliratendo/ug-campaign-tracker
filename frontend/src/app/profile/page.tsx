'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    notificationsEnabled: false,
    homeLocation: 'Kampala'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  const handleSave = () => {
    // Save to Supabase 'profiles' table (Phase 4 integration)
    alert('Preferences saved locally (Backend integration pending)');
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        
        <div className="mb-6">
          <p className="text-gray-600">Email: <span className="font-semibold text-gray-900">{user.email}</span></p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Preferences</h2>
          
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="notif"
              checked={preferences.notificationsEnabled}
              onChange={(e) => setPreferences(prev => ({...prev, notificationsEnabled: e.target.checked}))}
              className="h-4 w-4 text-blue-600 rounded" 
            />
            <label htmlFor="notif" className="text-gray-700">Enable Push Notifications</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Default Home Location</label>
            <input 
              type="text" 
              value={preferences.homeLocation}
              onChange={(e) => setPreferences(prev => ({...prev, homeLocation: e.target.value}))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            />
          </div>

          <button 
            onClick={handleSave} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
