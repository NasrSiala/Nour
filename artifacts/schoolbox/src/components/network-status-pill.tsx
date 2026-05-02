import { useNetworkStatus } from "@/hooks/use-network-status";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkStatusPill() {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setSyncing(false);
      return undefined;
    }
    if (wasOffline) {
      setSyncing(true);
      const t = setTimeout(() => {
        setSyncing(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOnline, wasOffline]);

  const offline = !isOnline;

  type StateKey = "online" | "offline" | "syncing";
  const stateKey: StateKey = syncing ? "syncing" : offline ? "offline" : "online";

  const states: Record<StateKey, { dot: string; label: string; labelColor: string; pulse: boolean }> = {
    online:  { dot: "#4ade80", label: "Connected",             labelColor: "#4d7a62", pulse: false },
    offline: { dot: "#f59e0b", label: "Offline · Saving locally", labelColor: "#d97706", pulse: true  },
    syncing: { dot: "#4ade80", label: "Syncing data…",         labelColor: "#4ade80", pulse: false },
  };

  const cfg = states[stateKey];

  return (
    <div
      style={{
        padding: "10px 14px 10px 12px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {/* Dot / spinner */}
      {stateKey === "syncing" ? (
        <Loader2
          className="animate-spin"
          style={{ width: "9px", height: "9px", color: "#4ade80", flexShrink: 0 }}
        />
      ) : (
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: cfg.dot,
            flexShrink: 0,
            display: "inline-block",
            boxShadow: cfg.pulse
              ? "0 0 0 3px rgba(245,158,11,0.25), 0 0 0 6px rgba(245,158,11,0.1)"
              : "none",
            transition: "box-shadow 0.3s",
          }}
        />
      )}

      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={stateKey}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 4 }}
          transition={{ duration: 0.18 }}
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: cfg.labelColor,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {cfg.label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
