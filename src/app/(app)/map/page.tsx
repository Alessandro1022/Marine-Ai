"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Anchor } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useT } from "@/lib/i18n";

const MarineMap = dynamic(() => import("@/components/map/MarineMap"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function MapPage() {
  const t = useT();
  return (
    <div>
      <PageHeader
        title={t("map.title")}
        action={
          <Link href="/marinas" className="btn-ghost !px-4 !py-2 text-xs">
            <Anchor size={14} /> {t("marinas.title")}
          </Link>
        }
      />
      <MarineMap />
    </div>
  );
}
