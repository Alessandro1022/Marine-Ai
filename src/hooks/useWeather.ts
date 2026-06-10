"use client";

import { useEffect, useState } from "react";
import { fetchWeather } from "@/lib/services/weatherService";
import type { WeatherSnapshot } from "@/types";

interface WeatherState {
  data: WeatherSnapshot | null;
  isLoading: boolean;
  error: string | null;
}

export function useWeather(lat: number | null, lon: number | null): WeatherState {
  const [state, setState] = useState<WeatherState>({ data: null, isLoading: false, error: null });

  useEffect(() => {
    if (lat === null || lon === null) return;
    setState({ data: null, isLoading: true, error: null });
    fetchWeather(lat, lon)
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((err) => setState({ data: null, isLoading: false, error: err.message }));
  }, [lat, lon]);

  return state;
}
