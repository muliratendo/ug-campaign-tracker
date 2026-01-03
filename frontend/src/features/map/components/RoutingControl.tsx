'use client';

import L from 'leaflet';
import { createControlComponent } from '@react-leaflet/core';
import 'leaflet-routing-machine';

// Define props if we want to pass options later
interface RoutingControlProps {
  // e.g. waypoints
}

const createRoutineMachineLayer = (props: RoutingControlProps) => {
  const instance = L.Routing.control({
    waypoints: [
      L.latLng(0.3476, 32.5825), // Start: Kampala
      L.latLng(0.0630, 32.4467)  // End: Entebbe (example default)
    ],
    lineOptions: {
      styles: [{ color: "#6FA1EC", weight: 4 }],
      extendToWaypoints: false,
      missingRouteTolerance: 0
    },
    show: true, // Show the itinerary panel
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
