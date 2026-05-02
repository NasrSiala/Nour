import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { School, GraduationCap, BookOpen, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const roles = [
  { value: "teacher" as const, label: "Teacher", icon: BookOpen, desc: "Manage classes & attendance" },
  { value: "student" as const, label: "Student", icon: GraduationCap, desc: "Access lessons & content" },
];

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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(145deg, #0a3d25 0%, #0f5535 40%, #1a7a52 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #ffffff 0%, transparent 50%), radial-gradient(circle at 20% 80%, #4ade80 0%, transparent 50%)" }} />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3">
          <div className="bg-white/15 p-2.5 rounded-xl backdrop-blur">
            <School className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-tight">SchoolBox</p>
            <p className="text-green-300 text-xs font-medium">Offline Platform</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 space-y-6">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight">
              Join the<br />
              <span className="text-green-300">SchoolBox community</span>
            </h2>
            <p className="text-green-100/80 mt-4 text-base leading-relaxed">
              Create your account and get instant access to your school's digital platform — even without internet.
            </p>
          </div>

          <div className="space-y-4">
            {roles.map((r, i) => (
              <motion.div key={r.value} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15 }}
                className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 mb-1">
                  <r.icon className="h-5 w-5 text-green-300" />
                  <span className="text-white font-semibold">{r.label} account</span>
                </div>
                <p className="text-green-100/70 text-sm pl-8">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="relative z-10 text-green-200/60 text-xs">
          Admin accounts are created by your school administrator.
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md py-8">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-primary/10 p-2 rounded-lg">
              <School className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">SchoolBox Offline</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h1>
            <p className="text-gray-500 mt-2">Fill in your details to get started</p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                  role === r.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}>
                <r.icon className={`h-6 w-6 ${role === r.value ? "text-primary" : "text-gray-400"}`} />
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                required placeholder="e.g. Ahmed Ben Ali"
                className="h-11 bg-white border-gray-200 focus:border-primary"
                autoComplete="name" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                required placeholder="Choose a unique username"
                className="h-11 bg-white border-gray-200 focus:border-primary"
                autoComplete="username" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="Min 6 characters"
                  className="h-11 bg-white border-gray-200 focus:border-primary pr-10"
                  autoComplete="new-password" />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm password</Label>
              <Input id="confirmPassword" type={showPassword ? "text" : "password"}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required placeholder="Repeat your password"
                className={`h-11 bg-white border-gray-200 focus:border-primary ${confirmPassword && confirmPassword !== password ? "border-destructive" : ""}`}
                autoComplete="new-password" />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-destructive">Passwords don't match</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm mt-2"
              disabled={isSubmitting || (!!confirmPassword && password !== confirmPassword)}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : `Create ${role} account`}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-primary font-semibold hover:underline cursor-pointer">Sign in</span>
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
