'use client';

import L from 'leaflet';
import { createControlComponent } from '@react-leaflet/core';
import 'leaflet-routing-machine';

// Backend API Proxy for Routing
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Custom TomTom Router (Proxied via Backend)
const TomTomRouter = L.Class.extend({
  options: {
    serviceUrl: `${API_URL}/routing`,
  },

  initialize: function(options: any) {
    L.Util.setOptions(this, options);
  },

  route: function(waypoints: any[], callback: (err: any, routes?: any[]) => void, context: any) {
    const locations = waypoints
      .map(wp => `${wp.latLng.lat},${wp.latLng.lng}`)
      .join(':');

    const url = `${this.options.serviceUrl}/${locations}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.routes || data.routes.length === 0) {
          callback(new Error('No routes found'));
          return;
        }

        const routes = data.routes.map((route: any) => {
          const coordinates = route.legs.flatMap((leg: any) => 
            leg.points.map((p: any) => L.latLng(p.latitude, p.longitude))
          );

          const instructions = route.guidance?.instructions.map((instr: any, i: number) => ({
            type: 'Straight', // Mapping to LRM expected types or generic
            text: instr.message,
            distance: instr.routeOffsetInMeters,
            time: instr.travelTimeInSeconds,
            index: i
          })) || [];

          return {
            name: route.summary.routeName || 'TomTom Route',
            summary: {
              totalDistance: route.summary.lengthInMeters,
              totalTime: route.summary.travelTimeInSeconds,
            },
            coordinates,
            instructions,
            inputWaypoints: waypoints,
            waypointIndices: [0, coordinates.length - 1] // Simple case for start/end
          };
        });

        callback.call(context, null, routes);
      })
      .catch(err => callback.call(context, err));
  }
});

const createRoutineMachineLayer = (props: any) => {
  const router = new (TomTomRouter as any)();
  
  const instance = L.Routing.control({
    router: router,
    waypoints: [
      L.latLng(0.3476, 32.5825), // Start: Kampala
      L.latLng(0.0630, 32.4467)  // End: Entebbe (example default)
    ],
    lineOptions: {
      styles: [{ color: "#6FA1EC", weight: 4 }],
      extendToWaypoints: false,
      missingRouteTolerance: 0
    },
    show: true, 
    addWaypoints: true,
    routeWhileDragging: true,
    fitSelectedRoutes: true,
    showAlternatives: true,
  });

  return instance;
};

// Create the React component
const RoutingControl = createControlComponent(createRoutineMachineLayer);

export default RoutingControl;
