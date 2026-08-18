const DB_NAME = "marivio-tiles";
const STORE_NAME = "tiles";
const CACHE_EXPIRY_DAYS = 30;

interface CachedTile {
  url: string;
  blob: Blob;
  timestamp: number;
}

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "url" });
      }
    };
  });
}

export async function cacheTile(url: string, blob: Blob): Promise<void> {
  const database = await initDB();
  const tx = database.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await new Promise((resolve, reject) => {
    const req = store.put({ url, blob, timestamp: Date.now() });
    req.onerror = () => reject(req.error);
    req.onsuccess = resolve;
  });
}

export async function getTile(url: string): Promise<Blob | null> {
  const database = await initDB();
  const tx = database.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve) => {
    const req = store.get(url);
    req.onsuccess = () => {
      const tile = req.result as CachedTile | undefined;
      if (!tile) {
        resolve(null);
        return;
      }
      const ageMs = Date.now() - tile.timestamp;
      const expireMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      resolve(ageMs > expireMs ? null : tile.blob);
    };
    req.onerror = () => resolve(null);
  });
}

export async function preloadTiles(
  center: { lat: number; lng: number },
  zoomLevel: number,
  radius: number = 3
): Promise<void> {
  const tilesNeeded = getTileCoordinates(center, zoomLevel, radius);
  for (const tile of tilesNeeded) {
    const urls = [
      `https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/${zoomLevel}/${tile.x}/${tile.y}.png`,
      `https://basemaps.cartocdn.com/rastertiles/voyager_nolabels/${zoomLevel}/${tile.x}/${tile.y}@2x.png`,
      `https://tiles.openseamap.org/seamark/${zoomLevel}/${tile.x}/${tile.y}.png`,
    ];
    for (const url of urls) {
      const cached = await getTile(url);
      if (!cached) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            await cacheTile(url, blob);
          }
        } catch {}
      }
    }
  }
}

function getTileCoordinates(
  center: { lat: number; lng: number },
  zoom: number,
  radius: number
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];
  const { x: cx, y: cy } = latLngToTile(center.lat, center.lng, zoom);
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      tiles.push({ x: cx + dx, y: cy + dy });
    }
  }
  return tiles;
}

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  );
  return { x, y };
}
