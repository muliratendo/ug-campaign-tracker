'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { useRouter } from 'next/navigation';
import { subscribeToPush, unsubscribeFromPush, isSubscribedToPush, requestTestNotification } from '@/lib/pushNotifications';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    notificationsEnabled: false,
    homeLocation: 'Kampala'
  });
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Check push subscription status on mount
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    const subscribed = await isSubscribedToPush();
    setIsPushSubscribed(subscribed);
    setPreferences(prev => ({ ...prev, notificationsEnabled: subscribed }));
  };

  const handleToggleNotifications = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    setMessage(null);

    try {
      if (isPushSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPush(user.id);
        if (success) {
          setIsPushSubscribed(false);
          setPreferences(prev => ({ ...prev, notificationsEnabled: false }));
          setMessage({ type: 'success', text: 'Push notifications disabled successfully!' });
        }
      } else {
        // Subscribe
        const success = await subscribeToPush(user.id);
        if (success) {
          setIsPushSubscribed(true);
          setPreferences(prev => ({ ...prev, notificationsEnabled: true }));
          setMessage({ type: 'success', text: 'Push notifications enabled! You\'ll receive rally alerts.' });
        } else {
          setMessage({ type: 'error', text: 'Failed to enable notifications. Please check your browser settings.' });
        }
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user || !isPushSubscribed) return;
    
    setIsProcessing(true);
    setMessage(null);

    try {
      await requestTestNotification(user.id);
      setMessage({ type: 'success', text: 'Test notification sent! Check your system tray.' });
    } catch (error) {
      console.error('Test notification error:', error);
      setMessage({ type: 'error', text: 'Failed to send test notification.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    // Save to Supabase 'profiles' table (Phase 4 integration)
    setMessage({ type: 'info', text: 'Preferences saved locally (Backend integration pending)' });
  };

  if (loading || !user) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">User Profile</h1>
        
        <div className="mb-6">
          <p className="text-gray-600">Email: <span className="font-semibold text-gray-900">{user.email}</span></p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Push Notifications Section */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">🔔 Push Notifications</h2>
            
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-800">Rally Alerts</p>
                  <p className="text-sm text-gray-600">Get notified about new campaign rallies and traffic updates</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isPushSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {isPushSubscribed ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleToggleNotifications}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded font-medium transition ${
                    isPushSubscribed 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? 'Processing...' : isPushSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
                </button>
                
                {isPushSubscribed && (
                  <button 
                    onClick={handleTestNotification}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Test
                  </button>
                )}
              </div>
            </div>

            {!isPushSubscribed && (
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="font-medium text-yellow-800">💡 Why enable notifications?</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-700">
                  <li>Get alerts 1 hour before rallies in your area</li>
                  <li>Receive traffic updates for your commute routes</li>
                  <li>Never miss important campaign events</li>
                </ul>
              </div>
            )}
          </div>

          {/* Other Preferences */}
          <div>
            <h2 className="text-lg font-semibold mb-4">⚙️ Preferences</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Home Location</label>
              <input 
                type="text" 
                value={preferences.homeLocation}
                onChange={(e) => setPreferences(prev => ({...prev, homeLocation: e.target.value}))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                placeholder="e.g., Kampala, Entebbe, Jinja"
              />
              <p className="text-xs text-gray-500 mt-1">Used to prioritize rally alerts in your area</p>
            </div>

            <button 
              onClick={handleSave} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
