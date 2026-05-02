import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { School, ShieldCheck, Wifi, BarChart3, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: ShieldCheck, text: "Offline-first — works without internet" },
  { icon: BarChart3, text: "Dropout risk engine with real-time alerts" },
  { icon: Wifi, text: "Auto-sync when connectivity returns" },
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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(145deg, #0a3d25 0%, #0f5535 40%, #1a7a52 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #ffffff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #4ade80 0%, transparent 50%)" }} />

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
          className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight">
              Empowering schools<br />
              <span className="text-green-300">across Tunisia</span>
            </h2>
            <p className="text-green-100/80 mt-4 text-base leading-relaxed">
              A complete offline-first school management platform built for rural schools with limited connectivity.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
                <f.icon className="h-5 w-5 text-green-300 shrink-0" />
                <span className="text-white/90 text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="relative z-10 flex gap-6 text-center">
          {[["115+", "Students"], ["5", "Classes"], ["15", "Subjects"]].map(([val, label]) => (
            <div key={label}>
              <p className="text-white text-2xl font-bold">{val}</p>
              <p className="text-green-300 text-xs">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-primary/10 p-2 rounded-lg">
              <School className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">SchoolBox Offline</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to access your portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="e.g. teacher1"
                className="h-11 bg-white border-gray-200 focus:border-primary"
                data-testid="input-username"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className="h-11 bg-white border-gray-200 focus:border-primary pr-10"
                  data-testid="input-password"
                  autoComplete="current-password"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold rounded-lg shadow-sm" disabled={isSubmitting} data-testid="button-submit">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/signup">
                <span className="text-primary font-semibold hover:underline cursor-pointer">Create one</span>
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs font-semibold text-primary mb-2">Demo credentials</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div><span className="font-medium block text-gray-800">admin</span>admin123</div>
              <div><span className="font-medium block text-gray-800">teacher1</span>teacher123</div>
              <div><span className="font-medium block text-gray-800">student1</span>student123</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
