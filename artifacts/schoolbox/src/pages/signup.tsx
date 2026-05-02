import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, BookOpen, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { LoginLogo, LogoMark } from "@/components/logo";

const roles = [
  { value: "teacher" as const, label: "Teacher", icon: BookOpen, desc: "Manage classes & attendance" },
  { value: "student" as const, label: "Student", icon: GraduationCap, desc: "Access lessons & content" },
];

const DARK = "#0B2819";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await register({ username, password, fullName, role });
      setLocation("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast({ title: "Sign up failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left editorial panel ── */}
      <div
        className="hidden lg:flex lg:w-[48%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ backgroundColor: DARK }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Ambient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #2d7a50 0%, transparent 70%)" }} />

        {/* Wordmark */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="relative z-10">
          <LoginLogo />
        </motion.div>

        {/* Editorial text */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="relative z-10">
          <p style={{ color: "#6ee7a8", fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600, marginBottom: "20px" }}>
            JOIN THE COMMUNITY
          </p>
          <h2 className="text-white leading-[1.1]"
            style={{ fontSize: "clamp(2rem, 3.2vw, 2.8rem)", fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Your school.<br />
            <span style={{ color: "#4ade80" }}>Always on.</span>
          </h2>
          <p style={{ color: "#a7c4b5", marginTop: "20px", fontSize: "15px", lineHeight: 1.65, maxWidth: "380px" }}>
            Create your account and access your school's digital platform — lessons, attendance, and more — with or without internet.
          </p>

          <div style={{ marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {roles.map((r, i) => (
              <motion.div key={r.value} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <r.icon style={{ width: "14px", height: "14px", color: "#4ade80", marginTop: "3px", flexShrink: 0 }} />
                <div>
                  <p style={{ color: "white", fontSize: "13px", fontWeight: 600 }}>{r.label} account</p>
                  <p style={{ color: "#7da890", fontSize: "12px", marginTop: "2px" }}>{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="relative z-10">
          <p style={{ color: "#3d6650", fontSize: "11px" }}>
            Admin accounts are created by your school administrator.
          </p>
        </motion.div>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-7 pb-0">
          <div className="lg:hidden flex items-center gap-2.5">
            <LogoMark size={26} />
            <span className="font-semibold text-gray-900" style={{ fontFamily: "'Sora', sans-serif" }}>Noor</span>
          </div>
          <div className="hidden lg:block" />
          <p className="text-xs text-gray-400 font-medium hidden sm:block">Tunisia Education Initiative</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[400px]">

            <div className="mb-8">
              <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", fontFamily: "'Sora', sans-serif" }}>
                Create account
              </h1>
              <p style={{ color: "#9ca3af", marginTop: "6px", fontSize: "14px" }}>Fill in your details to get started</p>
            </div>

            {/* Role picker */}
            <div style={{ marginBottom: "22px" }}>
              <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                I am a
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {roles.map(r => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "10px",
                        border: active ? `2px solid ${DARK}` : "2px solid #f3f4f6",
                        backgroundColor: active ? "#f0fdf4" : "white",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.12s",
                      }}
                    >
                      <r.icon style={{ width: "16px", height: "16px", color: active ? DARK : "#9ca3af", marginBottom: "6px" }} />
                      <p style={{ fontSize: "13px", fontWeight: 700, color: active ? DARK : "#374151" }}>{r.label}</p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <Label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase" }}>
                    Full name
                  </Label>
                  <Input
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name" required
                    style={{ marginTop: "6px", height: "42px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase" }}>
                    Username
                  </Label>
                  <Input
                    value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. ahmed.ben" required
                    style={{ marginTop: "6px", height: "42px", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <Label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase" }}>
                    Password
                  </Label>
                  <div style={{ position: "relative", marginTop: "6px" }}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters" required
                      style={{ height: "42px", fontSize: "14px", paddingRight: "44px" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                      {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9ca3af", textTransform: "uppercase" }}>
                    Confirm password
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password" required
                    style={{ marginTop: "6px", height: "42px", fontSize: "14px" }}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full"
                style={{ height: "46px", fontSize: "15px", fontWeight: 700, backgroundColor: DARK, fontFamily: "'Sora', sans-serif" }}>
                {isSubmitting ? "Creating account…" : "Create account →"}
              </Button>
            </form>

            <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "#9ca3af" }}>
              Already have an account?{" "}
              <Link href="/login">
                <span style={{ color: DARK, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
