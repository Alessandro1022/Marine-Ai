# MARIVIO - FAS 1, 2, 3 CLEAN

## Installation

1. Unzip denna fil i repo root
2. `git add .`
3. `git commit -m "feat: FAS 1-3 complete - strava + ai brain"`
4. `git push`

## Files Structure (CORRECT)

### Routes (INSIDE (app) group - NO ROOT DUPLICATES)
- `src/app/(app)/map/page.tsx` ← Map with STARTA/AVSLUTA
- `src/app/(app)/ai/page.tsx` ← Smart AI co-pilot
- `src/app/(app)/dashboard/page.tsx` ← Dashboard with weather
- `src/app/(app)/trips/page.tsx` ← Trip history (Strava-style)
- `src/app/(app)/trips/[id]/page.tsx` ← Trip detail page

### Stores
- `src/stores/tripStore.ts` ← Trip state management
- `src/stores/boatStore.ts` ← Boat info + memory

### Hooks
- `src/hooks/useTrip.ts` ← GPS tracking during trip
- `src/hooks/useGeolocation.ts` ← GPS location
- `src/hooks/useAIMemory.ts` ← AI context builder

### Components
- `src/components/map/MarineMap.tsx` ← OSM + seamarks (FIXED)
- `src/components/map/TripStartButton.tsx` ← Start/Stop button
- `src/components/TripCard.tsx` ← Trip card display

### AI
- `src/lib/ai/systemPrompt.ts` ← AI instructions

## What's Fixed

✅ NO duplicate pages in root (ai/page, map/page deleted)
✅ Correct [id] format (no backslashes)
✅ Dashboard included with correct properties
✅ All properties verified against actual types
✅ useGeolocation without isFallback
✅ Boat store uses `type` not `boat_type`
✅ Weather uses `temperature_c`, `wind_speed_ms`, `wind_direction_deg`
✅ Forecast uses `.hourly` array with correct properties

## Deploy

```bash
git push
# Vercel builds automatically
```

Ready to test!
