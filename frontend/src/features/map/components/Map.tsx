'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in Next.js/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src || markerIcon,
  iconRetinaUrl: markerIcon2x.src || markerIcon2x,
  shadowUrl: markerShadow.src || markerShadow,
});

interface Rally {
  id: string;
  title: string;
  location: string; // "POINT(x y)" or GeoJSON
  venue_name: string;
  start_time: string;
  description: string;
  candidate?: { name: string; color_hex: string };
}

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903]; 
const DEFAULT_ZOOM = 7;

import RoutingControl from './RoutingControl';

export default function GenericMap({ rallies, traffic = [] }: { rallies: Rally[], traffic?: any[] }) {


  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 shadow-md">
       <MapContainer center={UGANDA_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        <RoutingControl />
        
        {rallies.map((rally) => {
          // Parse Point if it's a string like "POINT(32.58 -0.31)"
          let lat = 0.3476;
          let lng = 32.5825;
          if (typeof rally.location === 'string' && rally.location.startsWith('POINT')) {
             const parts = rally.location.replace('POINT(', '').replace(')', '').split(' ');
             lng = parseFloat(parts[0]);
             lat = parseFloat(parts[1]);
          }

          return (
            <Marker key={rally.id} position={[lat, lng]}>
              <Popup>
                <div className="p-2">
                   {/* ... popup content same as before ... */}
                  <h3 className="font-bold">{rally.title}</h3>
                  <p className="text-sm text-gray-600">{rally.venue_name}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {traffic.map((t: any) => {
           // We need to match traffic to rally location. 
           // In real app, traffic prediction should have its own GEOM or reference the rally's geom.
           // For MVP, we assume we can link via the rally object expanded in the API response.
           if (!t.rally || !t.rally.location) return null;
           
           let lat = 0.3476;
           let lng = 32.5825;
           if (typeof t.rally.location === 'string' && t.rally.location.startsWith('POINT')) {
              const parts = t.rally.location.replace('POINT(', '').replace(')', '').split(' ');
              lng = parseFloat(parts[0]);
              lat = parseFloat(parts[1]);
           }

           const color = t.jam_level === 'critical' ? 'red' : t.jam_level === 'heavy' ? 'orange' : 'yellow';
           
           return (
             <Circle 
               key={t.id}
               center={[lat, lng]}
               radius={5000} // 5km impact zone
               pathOptions={{ color: color, fillColor: color, fillOpacity: 0.2 }}
             >
                <Popup>
                  <div className="text-center">
                    <strong>Traffic Alert: {t.jam_level.toUpperCase()}</strong>
                    <p>Delay: +{t.predicted_delay_minutes} mins</p>
                  </div>
                </Popup>
             </Circle>
           );
        })}
      </MapContainer>
    </div>
  );
}
