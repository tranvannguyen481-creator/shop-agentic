import { useEffect } from "react";
import api from "../../../shared/services/api";
import { auth } from "../../../shared/services/firebase";

/**
 * Listens to Firebase onIdTokenChanged and silently updates the session cookie
 * whenever Firebase proactively refreshes the ID token (~5 minutes before expiry).
 * Combined with the 401 Axios interceptor in api.ts this ensures the session
 * never expires mid-session without user interaction.
 */
export function useTokenAutoRefresh(): void {
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (!user) return;

      try {
        const idToken = await user.getIdToken();
        await api.post("/auth/session", { idToken });
      } catch {
        // Silent failure — the 401 interceptor handles reactive recovery.
      }
    });

    return () => unsubscribe();
  }, []);
}
