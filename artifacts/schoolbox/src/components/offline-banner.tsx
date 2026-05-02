import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface OfflineBannerProps {
  role?: "admin" | "teacher" | "student";
}

const roleMessages: Record<string, string> = {
  teacher: "Offline — attendance is queued locally and will sync automatically.",
  admin:   "Offline — data may be outdated. Changes will sync on reconnect.",
  student: "Offline — you can still browse previously loaded lessons.",
};

export function OfflineBanner({ role = "admin" }: OfflineBannerProps) {
  const { isOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowReconnected(false);
      return undefined;
    }
    if (wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOffline, wasOffline]);

  return (
    <AnimatePresence>
      {(isOffline || showReconnected) && (
        <motion.div
          key="banner"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: showReconnected ? "#0B2819" : "#1c1007",
              color: showReconnected ? "#4ade80" : "#fbbf24",
              borderBottom: `1px solid ${showReconnected ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)"}`,
            }}
          >
            {showReconnected ? (
              <>
                <Wifi style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                <span>Back online — syncing your data now.</span>
              </>
            ) : (
              <>
                <WifiOff style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                <span>{roleMessages[role]}</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
