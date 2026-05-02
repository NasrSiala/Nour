import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { LoginLogo } from "@/components/logo";

const DEMO = [
  { role: "Admin", user: "admin", pass: "admin123" },
  { role: "Teacher", user: "teacher1", pass: "teacher123" },
  { role: "Student", user: "student1", pass: "student123" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ username, password });
      setLocation("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left editorial panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ backgroundColor: "#0B2819" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #2d7a50 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 right-12 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4ade80 0%, transparent 70%)" }}
        />

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex items-center gap-3"
        >
          <LoginLogo />
        </motion.div>

        {/* Main editorial text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative z-10"
        >
          <p style={{ color: "#6ee7a8", fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600, marginBottom: "20px" }}>
            BUILT FOR RURAL TUNISIA
          </p>
          <h2
            className="text-white leading-[1.1]"
            style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Education doesn't stop<br />
            <span style={{ color: "#4ade80" }}>when connectivity does.</span>
          </h2>
          <p style={{ color: "#a7c4b5", marginTop: "20px", fontSize: "15px", lineHeight: 1.65, maxWidth: "400px" }}>
            A complete school management platform that works with or without internet — built for the classrooms that need it most.
          </p>

          {/* Feature list — no icon boxes, just clean lines */}
          <div style={{ marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "32px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              "Offline-first — all data is available without a connection",
              "Dropout risk engine that flags at-risk students early",
              "Auto-syncs to the cloud when connectivity returns",
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
              >
                <WifiOff
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "#4ade80",
                    marginTop: "3px",
                    flexShrink: 0,
                    opacity: i === 0 ? 1 : 0,
                  }}
                />
                <span style={{ color: "#c8ddd4", fontSize: "14px", lineHeight: 1.5 }}>
                  {i === 0 ? text : (
                    <>
                      <span style={{ display: "inline-block", width: "14px", marginLeft: "-14px", marginRight: "14px" }}>—</span>
                      {text}
                    </>
                  )}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "28px", display: "flex", gap: "40px" }}
        >
          {[["115+", "Élèves inscrits"], ["5", "Classes actives"], ["15", "Matières"]].map(([val, label]) => (
            <div key={label}>
              <p style={{ color: "white", fontSize: "26px", fontWeight: 800, fontFamily: "'Sora', sans-serif", lineHeight: 1 }}>{val}</p>
              <p style={{ color: "#6b9e82", fontSize: "12px", marginTop: "5px", fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-7 pb-0">
          <div className="lg:hidden flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "#0B2819", color: "#a7f3d0", fontFamily: "'Sora', sans-serif" }}
            >
              SB
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: "'Sora', sans-serif" }}>SchoolBox</span>
          </div>
          <div className="hidden lg:block" />
          <p className="text-xs text-gray-400 font-medium hidden sm:block">Tunisia Education Initiative</p>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[380px]"
          >
            <div style={{ marginBottom: "36px" }}>
              <h1
                className="text-gray-900"
                style={{ fontSize: "30px", fontWeight: 800, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.1 }}
              >
                Welcome back.
              </h1>
              <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "14.5px" }}>
                Sign in to your portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label
                  htmlFor="username"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", letterSpacing: "0.04em", marginBottom: "7px", textTransform: "uppercase" }}
                >
                  Username
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. teacher1"
                  className="h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:border-green-600"
                  style={{ fontSize: "15px" }}
                  data-testid="input-username"
                  autoComplete="username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", letterSpacing: "0.04em", marginBottom: "7px", textTransform: "uppercase" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    className="h-11 bg-gray-50 border-gray-200 text-gray-900 pr-11 focus-visible:ring-1 focus-visible:border-green-600"
                    style={{ fontSize: "15px" }}
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit"
                style={{
                  height: "46px",
                  width: "100%",
                  backgroundColor: isSubmitting ? "#4b7a5e" : "#0B2819",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  marginTop: "4px",
                  border: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  borderRadius: "8px",
                  transition: "background-color 0.15s",
                }}
                className="hover:opacity-90"
              >
                {isSubmitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : "Sign in →"}
              </Button>
            </form>

            <p style={{ marginTop: "20px", textAlign: "center", fontSize: "13.5px", color: "#9ca3af" }}>
              No account?{" "}
              <Link href="/signup">
                <span style={{ color: "#166534", fontWeight: 600, cursor: "pointer" }} className="hover:underline">
                  Request access
                </span>
              </Link>
            </p>

            {/* Demo credentials — clean table style */}
            <div
              style={{
                marginTop: "40px",
                borderTop: "1px solid #f3f4f6",
                paddingTop: "24px",
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", marginBottom: "14px", textTransform: "uppercase" }}>
                Demo Access
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0px", border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                {DEMO.map((d, i) => (
                  <button
                    key={d.role}
                    type="button"
                    onClick={() => { setUsername(d.user); setPassword(d.pass); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "white",
                      borderBottom: i < DEMO.length - 1 ? "1px solid #f3f4f6" : "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          color: i === 0 ? "#7c3aed" : i === 1 ? "#0369a1" : "#166534",
                          backgroundColor: i === 0 ? "#f5f3ff" : i === 1 ? "#e0f2fe" : "#f0fdf4",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                        }}
                      >
                        {d.role}
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#374151", fontWeight: 500 }}>{d.user}</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#9ca3af" }}>{d.pass}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "10px", textAlign: "center" }}>
                Click a row to fill in credentials automatically
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
