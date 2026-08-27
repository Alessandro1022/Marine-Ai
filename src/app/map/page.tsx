"use client";

import dynamic from "next/dynamic";
import { TripStartButton } from "@/components/map/TripStartButton";

const MarineMap = dynamic(() => import("@/components/map/MarineMap").then(mod => ({ default: mod.MarineMap })), {
  ssr: false,
  loading: () => <div className="h-full bg-deep animate-pulse" />,
});

export default function MapPage() {
  return (
    <div className="h-screen relative">
      <MarineMap />
      <TripStartButton />
    </div>
  );
}
