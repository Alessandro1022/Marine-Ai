# MARIVIO — Installation Guide

## Files included

✅ Depth tooltip (long-press sjökortet → visar djup)
✅ AI chat smart (ser väder, sjökort, båt-context)
✅ Logbook 12/10 (live GPS-track, stats, spara till DB)
✅ Offline cache (tiles pre-loads, ingen pixelkryp)

## Installation

### 1. Copy to your project

```bash
# From marivio-complete/ folder:

src/components/map/DepthTooltip.tsx     → Your src/components/map/
src/lib/services/aiContextBuilder.ts    → Your src/lib/services/
src/app/ai/page.tsx                     → Your src/app/(app)/ai/
src/app/logbook/page.tsx                → Your src/app/(app)/logbook/
src/lib/services/tileCache.ts           → Your src/lib/services/
src/hooks/useTilePreload.ts             → Your src/hooks/
public/sw.js                            → Your public/  (REPLACE existing)
```

### 2. Update MarineMap.tsx

Add to `src/components/map/MarineMap.tsx`:

```tsx
import { DepthTooltip } from "@/components/map/DepthTooltip";
import { useTilePreload } from "@/hooks/useTilePreload";

export function MarineMap() {
  useTilePreload();  // Call hook
  
  return (
    <MapContainer ...>
      <DepthTooltip />
      {/* existing layers */}
    </MapContainer>
  );
}
```

### 3. Register Service Worker

In `src/components/providers/Providers.tsx`:

```tsx
import { RegisterSW } from "@/components/pwa/RegisterSW";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <RegisterSW />  {/* This line */}
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
```

### 4. Add to Supabase (optional)

```sql
-- Add photo support to trips
alter table public.trips add column photo_urls text[] default '{}';
alter table public.trips add column weather_conditions text;
```

### 5. Test

```bash
npm run dev
```

- **Depth:** Go to map, long-press (hold 0.8s) on water
- **AI:** Go to AI tab, ask "Vad är vinden nu?"
- **Logbook:** Click "Starta loggning", move around, click "Stoppa"
- **Offline:** Disable internet, pan map → tiles load from cache

### 6. Push to GitHub

```bash
git add .
git commit -m "feat: depth-tooltip, smart AI, logbook 12/10, offline-cache"
git push
```

Done! ⛵
