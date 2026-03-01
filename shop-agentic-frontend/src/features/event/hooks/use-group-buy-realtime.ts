import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEventDetail } from "../../../shared/services/event-api";
import { db } from "../../../shared/services/firebase";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GroupBuyToast {
  id: string;
  displayName: string;
  message: string;
  timestamp: number;
}

export interface GroupBuyRealtimeData {
  /** Live member count from the event document's buyCount field */
  liveMemberCount: number;
  /** Toasts to display (auto-managed, newest first) */
  toasts: GroupBuyToast[];
  /** Dismiss a specific toast by id */
  dismissToast: (id: string) => void;
}

const TOAST_DURATION_MS = 5_000;
const MAX_TOASTS = 3;
/**
 * Polling interval (ms) used as fallback when the Firestore real-time
 * listener fails (e.g. security-rules block, expired token, network issues).
 */
const POLL_INTERVAL_MS = 5_000;

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Subscribes to real-time Firestore updates on the event document and the
 * `groupBuyActivity` sub-collection.  Returns a live member count and
 * auto-dismissing toast messages whenever a new member joins.
 *
 * Falls back to HTTP polling if the Firestore listener fails (e.g. security
 * rule blocks, token expiry, network issues).
 */
export function useGroupBuyRealtime(
  eventId: string,
  isGroupBuy: boolean,
): GroupBuyRealtimeData {
  const [liveMemberCount, setLiveMemberCount] = useState(0);
  const [toasts, setToasts] = useState<GroupBuyToast[]>([]);
  const [firestoreEventError, setFirestoreEventError] = useState(false);

  // Track whether the initial snapshot has been received so we only toast
  // for changes that happen AFTER the page loads.
  const initialSnapshotReceived = useRef(false);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // Track last known activity doc IDs so polling can detect new entries
  const knownActivityIds = useRef<Set<string>>(new Set());

  // ── Auto-dismiss helpers ──────────────────────────────────────────────────
  const scheduleAutoDismiss = useCallback((toastId: string) => {
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
      timersRef.current.delete(toastId);
    }, TOAST_DURATION_MS);
    timersRef.current.set(toastId, timer);
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
    const timer = timersRef.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(toastId);
    }
  }, []);

  // ── Cleanup all timers on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  // ── 1. Listen to event doc for buyCount ───────────────────────────────────
  useEffect(() => {
    if (!eventId || !isGroupBuy) {
      setLiveMemberCount(0);
      setFirestoreEventError(false);
      return;
    }

    const unsubscribe = db
      .collection("events")
      .doc(eventId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) return;
          const data = snapshot.data() ?? {};
          const count = Number(data["buyCount"] ?? data["currentCount"] ?? 0);
          setLiveMemberCount(count);
          setFirestoreEventError(false);
        },
        (err) => {
          console.warn("[useGroupBuyRealtime] event snapshot error:", err);
          setFirestoreEventError(true);
        },
      );

    return () => unsubscribe();
  }, [eventId, isGroupBuy]);

  // ── 2. HTTP polling fallback when Firestore event listener fails ──────────
  useEffect(() => {
    if (!eventId || !isGroupBuy || !firestoreEventError) return;

    const poll = async () => {
      try {
        const event = await fetchEventDetail(eventId);
        const count = Number(
          (event["buyCount"] as number | undefined) ??
            (event["currentCount"] as number | undefined) ??
            0,
        );
        setLiveMemberCount(count);
      } catch {
        // best-effort: silently ignore
      }
    };

    void poll(); // immediate first poll
    const intervalId = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [eventId, isGroupBuy, firestoreEventError]);

  // ── 3. Listen to groupBuyActivity sub-collection for join toasts ──────────
  useEffect(() => {
    if (!eventId || !isGroupBuy) {
      setToasts([]);
      initialSnapshotReceived.current = false;
      knownActivityIds.current.clear();
      return;
    }

    // We listen for the most recent entries ordered by joinedAt.
    // The first snapshot is the "initial" state — we skip toasting for those.
    const unsubscribe = db
      .collection("events")
      .doc(eventId)
      .collection("groupBuyActivity")
      .orderBy("joinedAt", "desc")
      .limit(10)
      .onSnapshot(
        (snapshot) => {
          if (!initialSnapshotReceived.current) {
            initialSnapshotReceived.current = true;
            // Seed known IDs so polling-based fallback doesn't re-toast them
            snapshot.docs.forEach((doc) =>
              knownActivityIds.current.add(doc.id),
            );
            return;
          }

          // Only process newly added documents
          const addedDocs = snapshot
            .docChanges()
            .filter((change) => change.type === "added");

          if (addedDocs.length === 0) return;

          const newToasts: GroupBuyToast[] = addedDocs.map((change) => {
            knownActivityIds.current.add(change.doc.id);
            const data = change.doc.data();
            const name =
              typeof data["displayName"] === "string" && data["displayName"]
                ? data["displayName"]
                : "Ai đó";
            const action =
              typeof data["action"] === "string" ? data["action"] : "joined";
            const message =
              action === "visited"
                ? `${name} vừa mở link mua nhóm!`
                : `${name} vừa tham gia mua nhóm!`;
            return {
              id: change.doc.id,
              displayName: name,
              message,
              timestamp: Number(data["joinedAt"] ?? Date.now()),
            };
          });

          setToasts((prev) => {
            const merged = [...newToasts, ...prev].slice(0, MAX_TOASTS);
            return merged;
          });

          // Schedule auto-dismiss for each new toast
          newToasts.forEach((t) => scheduleAutoDismiss(t.id));
        },
        (err) => {
          console.warn(
            "[useGroupBuyRealtime] groupBuyActivity snapshot error:",
            err,
          );
          // Mark initial as received so polling fallback can take over
          initialSnapshotReceived.current = true;
        },
      );

    return () => {
      unsubscribe();
      initialSnapshotReceived.current = false;
      knownActivityIds.current.clear();
    };
  }, [eventId, isGroupBuy, scheduleAutoDismiss]);

  // ── 4. HTTP polling fallback for groupBuyActivity toasts ─────────────────
  // Only activates after the initial snapshot is received (real or fallback)
  // and runs every POLL_INTERVAL_MS to catch new entries missed by Firestore.
  useEffect(() => {
    if (!eventId || !isGroupBuy) return;

    const pollActivity = async () => {
      // Only poll if Firestore subscription has been initialized
      if (!initialSnapshotReceived.current) return;

      try {
        const snapshot = await db
          .collection("events")
          .doc(eventId)
          .collection("groupBuyActivity")
          .orderBy("joinedAt", "desc")
          .limit(10)
          .get();

        const newDocs = snapshot.docs.filter(
          (doc) => !knownActivityIds.current.has(doc.id),
        );

        if (newDocs.length === 0) return;

        const newToasts: GroupBuyToast[] = newDocs.map((doc) => {
          knownActivityIds.current.add(doc.id);
          const data = doc.data();
          const name =
            typeof data["displayName"] === "string" && data["displayName"]
              ? data["displayName"]
              : "Ai đó";
          const action =
            typeof data["action"] === "string" ? data["action"] : "joined";
          const message =
            action === "visited"
              ? `${name} vừa mở link mua nhóm!`
              : `${name} vừa tham gia mua nhóm!`;
          return {
            id: doc.id,
            displayName: name,
            message,
            timestamp: Number(data["joinedAt"] ?? Date.now()),
          };
        });

        if (newToasts.length === 0) return;

        setToasts((prev) => {
          const merged = [...newToasts, ...prev].slice(0, MAX_TOASTS);
          return merged;
        });
        newToasts.forEach((t) => scheduleAutoDismiss(t.id));
      } catch {
        // best-effort: silently ignore
      }
    };

    const intervalId = setInterval(() => void pollActivity(), POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [eventId, isGroupBuy, scheduleAutoDismiss]);

  return { liveMemberCount, toasts, dismissToast };
}
