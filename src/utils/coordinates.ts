import * as THREE from 'three';

/**
 * Converts Latitude and Longitude to 3D Cartesian coordinates on a sphere of radius R
 * Using:
 *   x = -R * Math.cos(lat * Math.PI / 180) * Math.cos(lng * Math.PI / 180)
 *   y =  R * Math.sin(lat * Math.PI / 180)
 *   z =  R * Math.cos(lat * Math.PI / 180) * Math.sin(lng * Math.PI / 180)
 */
export function latLngToVector3(lat: number, lng: number, radius = 2.0): THREE.Vector3 {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;

  // In Three.js SphereGeometry (u in [0, 1] mapped from lng in [-180, 180]):
  // u = (lng + 180)/360 => u*2pi = lambda + pi => cos(u*2pi) = -cos(lambda), sin(u*2pi) = -sin(lambda)
  // v = (90 - lat)/180 => v*pi = pi/2 - phi => sin(v*pi) = cos(phi), cos(v*pi) = sin(phi)
  // x = -radius * cos(u*2pi) * sin(v*pi) = +radius * cos(phi) * cos(lambda)
  // y = radius * cos(v*pi) = radius * sin(phi)
  // z = radius * sin(u*2pi) * sin(v*pi) = -radius * cos(phi) * sin(lambda)
  const x = radius * Math.cos(phi) * Math.cos(lambda);
  const y = radius * Math.sin(phi);
  const z = -radius * Math.cos(phi) * Math.sin(lambda);

  return new THREE.Vector3(x, y, z);
}

/**
 * Converts 3D Cartesian vector on a sphere back to Latitude and Longitude
 * Returns raw, exact floating-point geographical coordinates (lat, lng).
 */
export function vector3ToLatLng(vec: THREE.Vector3): { lat: number; lng: number } {
  const normalized = vec.clone().normalize();
  
  // y = sin(lat) => lat = asin(y)
  const lat = Math.asin(Math.max(-1, Math.min(1, normalized.y))) * (180 / Math.PI);
  
  // -z = cos(lat)*sin(lng), x = cos(lat)*cos(lng) => lng = atan2(-z, x)
  const lng = Math.atan2(-normalized.z, normalized.x) * (180 / Math.PI);

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

/**
 * Haversine formula to compute great-circle distance between two lat/lng coordinates in km
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
