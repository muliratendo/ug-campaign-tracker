/**
 * Centralized API Configuration
 * Ensures the BASE_API_URL always has the correct prefix and trailing slash handling
 */

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').trim();

// 1. Strip any trailing slashes for consistency
const cleanUrl = rawApiUrl.replace(/\/+$/, '');

// 2. Ensure /api is at the end if not already present
export const BASE_API_URL = cleanUrl.endsWith('/api') 
  ? cleanUrl 
  : `${cleanUrl}/api`;

console.log('🌐 API Base URL initialized:', BASE_API_URL);
