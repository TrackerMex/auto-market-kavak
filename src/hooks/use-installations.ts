import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { readInstallationsCache, writeInstallationsCache } from "@/lib/cache/installations-cache";
import { POLLING_INTERVAL_MS } from "@/lib/constants";
import {
  fetchInstallationsData,
  InstallationsThrottleError,
} from "@/lib/installations-service";
import type { InstallationsData } from "@/types/installation";

interface UseInstallationsState {
  data: InstallationsData | null;
  isLoading: boolean;
  error: string | null;
  hasChanges: boolean;
}

let initialState: UseInstallationsState = {
  data: null,
  isLoading: true,
  error: null,
  hasChanges: false,
};

if (typeof window !== "undefined") {
  const cachedData = readInstallationsCache();
  if (cachedData) {
    initialState = {
      data: cachedData,
      isLoading: false,
      error: null,
      hasChanges: false,
    };
  }
}

export function useInstallations() {
  const [state, setState] = useState<UseInstallationsState>(initialState);

  const abortRef = useRef<AbortController | null>(null);
  const hasHydratedRef = useRef(false);

  const sync = useCallback(async () => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setState((current) => ({ ...current, isLoading: true, error: null }));

    try {
      const freshData = await fetchInstallationsData(abortController.signal);
      setState((current) => {
        const previousChecksum = current.data?.checksum;
        const hasChanges = Boolean(previousChecksum && previousChecksum !== freshData.checksum);

        return {
          data: freshData,
          isLoading: false,
          error: null,
          hasChanges,
        };
      });
      writeInstallationsCache(freshData);
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      if (error instanceof InstallationsThrottleError) {
        setState((current) => ({ ...current, isLoading: false }));
        return;
      }

      const message = error instanceof Error ? error.message : "No se pudo cargar el dashboard.";
      setState((current) => ({ ...current, isLoading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    hasHydratedRef.current = true;
    void sync();

    const pollingTimer = window.setInterval(() => {
      void sync();
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(pollingTimer);
      abortRef.current?.abort();
    };
  }, [sync]);

  const stats = useMemo(() => {
    const installations = state.data?.installations ?? [];
    const total = installations.length;
    const pending = installations.filter((item) => item.estatusFinal === "PENDIENTE").length;
    const finished = installations.filter((item) => item.estatusFinal === "FINALIZADO").length;
    const avgProgress =
      total > 0
        ? Math.round(
            installations.reduce((acc, current) => acc + current.porcentajeAvance, 0) / total,
          )
        : 0;

    return {
      total,
      pending,
      finished,
      avgProgress,
    };
  }, [state.data]);

  return {
    ...state,
    stats,
    hasHydrated: hasHydratedRef.current,
    sync,
  };
}
