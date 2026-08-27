import { useEffect, useRef } from 'react';
import { useTripStore, type TripPoint } from '@/stores/tripStore';
import { useGeolocation } from './useGeolocation';

export function useTrip() {
  const { activeTrip, isRecording, addPoint } = useTripStore();
  const { lat, lon, heading, speed } = useGeolocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRecording || !activeTrip) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (lat && lon) {
        const point: TripPoint = {
          lat,
          lon,
          timestamp: Date.now(),
          sogKn: speed || 0,
          cogDeg: heading || 0,
        };
        addPoint(point);
      }
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording, activeTrip, lat, lon, heading, speed, addPoint]);
}
