"use client";

import { useEffect, useState } from "react";

interface GeoState {
  lat: number | null;
  lon: number | null;
  error: string | null;
}

export function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({ lat: null, lon: null, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lon: pos.coords.longitude, error: null }),
      (err) => setState((s) => ({ ...s, error: err.message })),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return state;
}
