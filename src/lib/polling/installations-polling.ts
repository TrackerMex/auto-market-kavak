import { REQUEST_THROTTLE_MS } from "@/lib/constants";

let lastRequestAt = 0;

export function canRequestInstallations(now = Date.now()): boolean {
  return now - lastRequestAt >= REQUEST_THROTTLE_MS;
}

export function markInstallationsRequest(now = Date.now()) {
  lastRequestAt = now;
}
