import { useEffect } from "react";
import api from "../../../shared/services/api";
import { auth } from "../../../shared/services/firebase";

export function useTokenAutoRefresh(): void {
  useEffect(() => {
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (!user) return;

      try {
        const idToken = await user.getIdToken();
        await api.post("/auth/session", { idToken });
      } catch {

      }
    });

    return () => unsubscribe();
  }, []);
}
