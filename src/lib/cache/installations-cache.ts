import { CACHE_TTL_MS, INSTALLATIONS_CACHE_KEY } from "@/lib/constants";
import type { InstallationsData } from "@/types/installation";

interface CacheRecord {
  expiresAt: number;
  data: InstallationsData;
}

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readInstallationsCache(): InstallationsData | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const rawCache = window.localStorage.getItem(INSTALLATIONS_CACHE_KEY);
  if (!rawCache) {
    return null;
  }

  try {
    const cacheRecord = JSON.parse(rawCache) as CacheRecord;
    if (!cacheRecord?.data || typeof cacheRecord.expiresAt !== "number") {
      return null;
    }

    if (Date.now() > cacheRecord.expiresAt) {
      window.localStorage.removeItem(INSTALLATIONS_CACHE_KEY);
      return null;
    }

    return cacheRecord.data;
  } catch {
    window.localStorage.removeItem(INSTALLATIONS_CACHE_KEY);
    return null;
  }
}

export function writeInstallationsCache(data: InstallationsData) {
  if (!isBrowserEnvironment()) {
    return;
  }

  const cacheRecord: CacheRecord = {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  window.localStorage.setItem(INSTALLATIONS_CACHE_KEY, JSON.stringify(cacheRecord));
}
