'use client';

import MapWrapper from '../features/map/components/MapWrapper';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Rally {
  id: string;
  title: string;
  location: string;
  venue_name: string;
  start_time: string;
  description: string;
  candidate?: { name: string; color_hex: string };
}

export default function Home() {
  const { user, signOut } = useAuth();
  const [rallies, setRallies] = useState<Rally[]>([]);
  const [filteredRallies, setFilteredRallies] = useState<Rally[]>([]);
  const [traffic, setTraffic] = useState<any[]>([]); // New traffic state
  const [filters, setFilters] = useState({
    date: '',
    candidate: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Parallel Fetch
        const [ralliesRes, trafficRes] = await Promise.all([
           fetch(`${apiUrl}/rallies`),
           fetch(`${apiUrl}/traffic`)
        ]);

        if (ralliesRes.ok) {
          const data = await ralliesRes.json();
          setRallies(data);
          setFilteredRallies(data);
        }

        if (trafficRes.ok) {
           const tData = await trafficRes.json();
           setTraffic(tData);
        }

      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = rallies;
    if (filters.date) {
      result = result.filter(r => r.start_time.startsWith(filters.date));
    }
    if (filters.candidate) {
      result = result.filter(r => r.candidate?.name.toLowerCase().includes(filters.candidate.toLowerCase()));
    }
    setFilteredRallies(result);
  }, [filters, rallies]);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50">
      <header className="w-full max-w-5xl mb-8 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Uganda Campaign Tracker 🇺🇬</h1>
          <p className="text-sm text-gray-500">Real-time rally tracking</p>
        </div>
        
        <div className="flex gap-4 items-center">
            {/* Filters */}
            <input 
              type="date" 
              className="border rounded px-2 py-1 text-sm"
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            />
            <input 
              type="text" 
              placeholder="Search Candidate" 
              className="border rounded px-2 py-1 text-sm"
              onChange={(e) => setFilters(prev => ({ ...prev, candidate: e.target.value }))}
            />

           {user ? (
             <div className="flex gap-2 items-center ml-4 border-l pl-4">
               <span className="text-xs text-gray-700">{user.email?.split('@')[0]}</span>
               <Link href="/profile" className="text-xs font-medium text-blue-600 hover:text-blue-500 hover:underline">
                 Profile
               </Link>
               <button onClick={() => signOut()} className="text-xs font-semibold text-red-600 hover:text-red-500 ml-2">
                 Sign Out
               </button>
             </div>
           ) : (
             <Link href="/auth/login" className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
               Sign In
             </Link>
           )}
        </div>
      </header>

      <section className="w-full max-w-5xl">
        <MapWrapper rallies={filteredRallies} traffic={traffic} />
      </section>

      <section className="mt-8 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">Upcoming Rallies</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-gray-500 mt-1">Scheduled in next 7 days</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-900 mb-2">High Congestion Areas</h3>
           <p className="text-3xl font-bold text-red-500">0</p>
           <p className="text-sm text-gray-500 mt-1">Predicted traffic jams</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
           <h3 className="font-semibold text-gray-900 mb-2">Active Candidates</h3>
           <p className="text-3xl font-bold text-green-600">0</p>
           <p className="text-sm text-gray-500 mt-1">Campaigning currently</p>
        </div>
      </section>
    </main>
  )
}
