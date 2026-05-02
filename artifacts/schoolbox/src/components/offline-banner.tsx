import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface OfflineBannerProps {
  role?: "admin" | "teacher" | "student";
}

const roleMessages: Record<string, string> = {
  teacher:
    "You are offline. Attendance records will be queued locally and synced automatically when the connection is restored.",
  admin:
    "You are offline. Some data may be outdated. Changes will sync when connectivity is restored.",
  student:
    "You are offline. You can still browse previously loaded content.",
};

export function OfflineBanner({ role = "admin" }: OfflineBannerProps) {
  const { isOffline } = useNetworkStatus();
  const [showReconnecting, setShowReconnecting] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowReconnecting(false);
      return undefined;
    }
    if (wasOffline) {
      setShowReconnecting(true);
      const t = setTimeout(() => {
        setShowReconnecting(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOffline, wasOffline]);

  return (
    <AnimatePresence>
      {(isOffline || showReconnecting) && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -48 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm font-medium z-50 ${
            showReconnecting
              ? "bg-emerald-600 text-white"
              : "bg-amber-500 text-white"
          }`}
        >
          {showReconnecting ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Connection restored — syncing data…</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 shrink-0" />
              <span>{roleMessages[role]}</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
