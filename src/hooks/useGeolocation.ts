import { useEffect, useState } from 'react';

export interface GeolocationData {
  lat: number | null;
  lon: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
}

export function useGeolocation() {
  const [geo, setGeo] = useState<GeolocationData>({
    lat: null,
    lon: null,
    heading: null,
    speed: null,
    accuracy: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;
        
        setGeo({
          lat: latitude,
          lon: longitude,
          heading: heading || null,
          speed: speed ? speed * 1.94384 : null,
          accuracy: accuracy,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setGeo({
          lat: 57.7089,
          lon: 11.9746,
          heading: null,
          speed: null,
          accuracy: null,
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return geo;
}
