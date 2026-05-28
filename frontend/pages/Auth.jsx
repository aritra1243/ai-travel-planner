import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft, Mail, Lock, User, AlertCircle, Eye, EyeOff, Globe } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";

const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
];

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Good", color: "#3b82f6" };
  return { score, label: "Strong", color: "#10b981" };
}

export default function Auth({ type, onAuthSuccess, onBack, onToggleType }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, register } = useAuthStore();

  const bgImage = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
  const strength = type === "register" ? getPasswordStrength(password) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let authedUser;
      if (type === "register") {
        authedUser = await register(name, email, password);
      } else {
        authedUser = await login(email, password);
      }
      const token = localStorage.getItem("vagabond_token");
      onAuthSuccess(token, authedUser);
    } catch (err) {
      setError(err.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="Travel" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,26,11,0.85), rgba(30,40,26,0.75))" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,156,134,0.8) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/80 hover:text-white transition-all"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      {/* Floating trust badge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white/60"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
        <Globe className="w-3.5 h-3.5" />
        <span>10,000+ travelers use Vagabond</span>
      </div>

      {/* Auth Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -16 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div
            className="rounded-3xl p-8 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.15)"
            }}
          >
            {/* Decorative accent */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #8b9c86, transparent)" }} />

            {/* Header */}
            <div className="text-center mb-7">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)", boxShadow: "0 8px 20px rgba(139,156,134,0.35)" }}
              >
                <Sparkles className="w-7 h-7 text-white animate-bounce-gentle" />
              </div>

              <h2 className="font-serif text-2xl font-bold text-slate-800 mb-1.5">
                {type === "register" ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                {type === "register"
                  ? "Start planning incredible trips with AI. Free forever."
                  : "Sign in to access your saved itineraries and travel plans."}
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3.5 rounded-2xl mb-5 text-xs"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-red-700 block">Authentication Error</span>
                  <p className="text-red-600 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {type === "register" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 pl-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="register-name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-11"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter */}
                {type === "register" && password && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-1">
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }} />
                      ))}
                    </div>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: strength.color }}>{strength.label} password</p>
                  </motion.div>
                )}
              </div>

              <button
                id="auth-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2 text-sm"
                style={loading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {type === "register" ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  type === "register" ? "Create Account — It's Free" : "Sign In"
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-6 pt-5 border-t border-stone-100 text-center text-sm">
              <span className="text-slate-500">
                {type === "register" ? "Already have an account?" : "New to Vagabond?"}{" "}
              </span>
              <button
                onClick={onToggleType}
                className="font-semibold hover:underline transition-colors"
                style={{ color: "#6d7c69" }}
              >
                {type === "register" ? "Sign in" : "Create a free account"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
