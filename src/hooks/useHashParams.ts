import { useMemo } from "react";

export function useHashParams() {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }
    const hash = window.location.hash.slice(1);
    return new URLSearchParams(hash);
  }, []);
}
