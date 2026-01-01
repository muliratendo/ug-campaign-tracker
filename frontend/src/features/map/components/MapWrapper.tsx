'use client';

import dynamic from 'next/dynamic';

// @ts-ignore
const MapComponent = dynamic<any>(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading Map...</div>
});

export default function MapWrapper({ rallies, traffic }: { rallies: any[], traffic?: any[] }) {
  return <MapComponent rallies={rallies} traffic={traffic} />;
}
