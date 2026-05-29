import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  Compass, Sparkles, Map, ArrowRight, Globe, Zap,
  DollarSign, CloudSun, Users, Star, Check, ChevronDown,
  Play, Shield, Cpu, Navigation
} from "lucide-react";



/* ─── Data ───────────────────────────────────────────────────────── */
const DESTINATIONS = [
  { name: "Tokyo", country: "Japan", emoji: "🗼", color: "from-rose-900/80 to-pink-900/80", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80" },
  { name: "Santorini", country: "Greece", emoji: "🏛️", color: "from-blue-900/80 to-indigo-900/80", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&q=80" },
  { name: "Bali", country: "Indonesia", emoji: "🌴", color: "from-emerald-900/80 to-teal-900/80", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80" },
  { name: "Paris", country: "France", emoji: "🗺️", color: "from-amber-900/80 to-yellow-900/80", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80" },
];

const STATS = [
  { value: "10K+", label: "Trips Generated", icon: <Globe className="w-5 h-5" /> },
  { value: "150+", label: "Countries Covered", icon: <Map className="w-5 h-5" /> },
  { value: "Free", label: "Forever Free Tier", icon: <Sparkles className="w-5 h-5" /> },
  { value: "< 30s", label: "Generation Speed", icon: <Zap className="w-5 h-5" /> },
];

const FEATURES = [
  { icon: <Sparkles className="w-6 h-6" />, title: "AI Itinerary Builder", description: "Powered by Gemini AI, get day-by-day schedules optimized for your travel style, interests, and pace.", color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.25)" },
  { icon: <Map className="w-6 h-6" />, title: "Interactive Maps", description: "All your destinations plotted on OpenStreetMap — pins, routes, and attractions all in one place.", color: "from-emerald-500 to-teal-600", glow: "rgba(16,185,129,0.25)" },
  { icon: <DollarSign className="w-6 h-6" />, title: "Smart Budget Estimator", description: "AI-powered cost breakdown for accommodation, dining, transport, and activities.", color: "from-amber-500 to-orange-600", glow: "rgba(245,158,11,0.25)" },
  { icon: <CloudSun className="w-6 h-6" />, title: "Weather Insights", description: "Seasonal climate data and smart packing recommendations for any destination.", color: "from-sky-500 to-blue-600", glow: "rgba(14,165,233,0.25)" },
  { icon: <Users className="w-6 h-6" />, title: "AI Trip Chat", description: "Ask anything about your trip — local tips, restaurants, currency, transport advice in real-time.", color: "from-rose-500 to-pink-600", glow: "rgba(244,63,94,0.25)" },
  { icon: <Globe className="w-6 h-6" />, title: "Share & Export", description: "Share your itinerary with travel companions via a link, or export it as a beautiful PDF.", color: "from-indigo-500 to-blue-600", glow: "rgba(99,102,241,0.25)" },
];

const TESTIMONIALS = [
  { name: "Priya S.", location: "Mumbai", text: "Used Vagabond for my Tokyo trip — it generated a perfect 7-day plan in under 30 seconds. The map feature is incredible!", rating: 5, avatar: "P", color: "#f43f5e" },
  { name: "James W.", location: "London", text: "Finally a travel planner that doesn't cost a fortune. The Bali itinerary was spot on and saved me hours of research.", rating: 5, avatar: "J", color: "#8b9c86" },
  { name: "Sofia M.", location: "Barcelona", text: "The budget breakdown was incredibly accurate. Planned my Greece trip with exact cost estimates. Absolutely love it!", rating: 5, avatar: "S", color: "#6366f1" },
];

const PLANS = [
  { name: "Free", price: "0", period: "forever", features: ["3 AI trips/month", "Interactive maps", "Budget estimator", "Weather insights"], cta: "Get Started Free", highlight: false },
  { name: "Pro", price: "299", period: "month", currency: "INR", features: ["Unlimited AI trips", "AI Chat assistant", "Trip sharing", "Priority generation", "Advanced budget tools"], cta: "Upgrade to Pro", highlight: true },
  { name: "Premium", price: "599", period: "month", currency: "INR", features: ["Everything in Pro", "Multi-destination trips", "Live currency rates", "PDF export", "VIP support"], cta: "Go Premium", highlight: false },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Enter Your Destination", desc: "Tell us where you're going, your dates, budget, and travel interests.", icon: <Navigation className="w-7 h-7" />, color: "#8b9c86" },
  { step: "02", title: "AI Generates Your Plan", desc: "Gemini AI crafts a detailed day-by-day itinerary in under 30 seconds.", icon: <Cpu className="w-7 h-7" />, color: "#6366f1" },
  { step: "03", title: "Explore & Customize", desc: "View your trip on an interactive map, check budgets, and share with friends.", icon: <Map className="w-7 h-7" />, color: "#f43f5e" },
];

/* ─── Animated Counter ───────────────────────────────────────────── */
function AnimatedStat({ value, label, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="text-sage-glow mb-1 transition-transform group-hover:scale-125 duration-300" style={{ color: "#8b9c86" }}>
        {icon}
      </div>
      <div className="font-serif text-4xl font-bold text-white tracking-tight">{value}</div>
      <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}

/* ─── Feature Card ───────────────────────────────────────────────── */
function FeatureCard({ feat, i }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    }
  };

  return (
    <motion.div
      key={i}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="feature-card-3d group cursor-default"
      style={{ transition: "transform 0.15s ease, box-shadow 0.3s ease" }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${feat.glow}, transparent 70%)` }}
      />

      <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-5 text-white shadow-lg
        group-hover:scale-110 transition-transform duration-300`}>
        {feat.icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2.5 font-serif">{feat.title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{feat.description}</p>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full bg-gradient-to-r ${feat.color} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
    </motion.div>
  );
}

/* ─── Typing Hero Text ───────────────────────────────────────────── */
const TYPING_WORDS = ["dream trip", "adventure", "escape", "journey", "getaway"];

function TypingText() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = TYPING_WORDS[wordIndex];
    let timeout;

    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % TYPING_WORDS.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIndex]);

  return (
    <span className="text-gradient-animated italic">
      {displayed}
      <span className="animate-blink">|</span>
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function LandingPage({ onGetStarted, onExplorePricing, onExplore }) {
  const [activeDestIndex, setActiveDestIndex] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDestIndex((i) => (i + 1) % DESTINATIONS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="lp-root flex flex-col min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a120a 0%, #1a2318 40%, #0f1a0e 70%, #060e06 100%)" }}
      >
        {/* Animated grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(rgba(139,156,134,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,156,134,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />

        {/* Radial gradient vignette */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(6,14,6,0.8) 100%)" }}
        />

        {/* Ambient orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/6 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,156,134,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/3 right-1/6 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(235,220,185,0.08) 0%, transparent 70%)", filter: "blur(50px)" }}
        />

        <motion.div
              style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full"
        >
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">

            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 tracking-wide"
                style={{
                  background: "rgba(139,156,134,0.15)",
                  border: "1px solid rgba(139,156,134,0.35)",
                  color: "#b5c4b1",
                  boxShadow: "0 0 20px rgba(139,156,134,0.1)"
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Google Gemini AI
              </motion.div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4.5rem] font-bold text-white leading-[1.05] mb-5 sm:mb-6 tracking-tight">
                Plan your
                <br />
                <TypingText />
                <br />
                <span className="text-white/60 text-3xl sm:text-4xl sm:text-5xl lg:text-6xl">with AI.</span>
              </h1>

              <p className="text-lg text-white/55 mb-10 max-w-lg leading-relaxed">
                Tell us where you want to go. Vagabond crafts a perfect personalized itinerary — with maps, budgets, weather, and day-by-day activities — in under 30 seconds.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <motion.button
                  id="hero-get-started"
                  onClick={onGetStarted}
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(139,156,134,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary-3d flex items-center gap-2.5 group text-sm"
                >
                  Start Planning for Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </motion.button>

                <motion.button
                  onClick={onExplore || onGetStarted}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white/70 border transition-all duration-300 hover:text-white hover:border-white/30 hover:bg-white/5"
                  style={{ border: "1.5px solid rgba(255,255,255,0.12)" }}
                >
                  <Play className="w-3.5 h-3.5" />
                  See How It Works
                </motion.button>
              </div>

              {/* Trust strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-5"
              >
                <div className="flex -space-x-2.5">
                  {["#f43f5e", "#8b9c86", "#6366f1", "#f59e0b"].map((c, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-[#0f1a0e] flex items-center justify-center text-xs font-bold text-white shadow-md"
                      style={{ background: c, zIndex: 4 - i }}
                    >
                      {["A", "B", "C", "D"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-white/40 text-xs">Trusted by 10,000+ travelers</p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/35">
                  <Shield className="w-3.5 h-3.5" />
                  No credit card needed
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Image Mosaic */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Mosaic Grid */}
              <div className="relative w-[520px] h-[500px]">

                {/* Glow backdrop */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(139,156,134,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />

                {/* Image 1 — Large top-left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute top-0 left-0 w-[58%] h-[54%] rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: "1.5px solid rgba(139,156,134,0.25)" }}
                >
                  <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=85"
                    alt="Tokyo" className="w-full h-full object-cover"
                    style={{ animation: "kenBurns 16s ease-in-out infinite alternate" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, transparent 50%, rgba(10,18,10,0.7) 100%)" }} />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white font-serif text-lg font-bold drop-shadow-lg">Tokyo</span>
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Japan</p>
                  </div>
                </motion.div>

                {/* Image 2 — Top-right narrow */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute top-0 right-0 w-[38%] h-[38%] rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: "1.5px solid rgba(235,220,185,0.2)" }}
                >
                  <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=85"
                    alt="Paris" className="w-full h-full object-cover"
                    style={{ animation: "kenBurns 18s ease-in-out infinite alternate-reverse" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(10,18,10,0.75) 100%)" }} />
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-white font-serif text-sm font-bold drop-shadow-lg">Paris</span>
                  </div>
                </motion.div>

                {/* Image 3 — Bottom-left */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="absolute bottom-0 left-0 w-[38%] h-[42%] rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: "1.5px solid rgba(99,102,241,0.25)" }}
                >
                  <img src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=85"
                    alt="Bali" className="w-full h-full object-cover"
                    style={{ animation: "kenBurns 20s ease-in-out infinite alternate" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(10,18,10,0.75) 100%)" }} />
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="text-white font-serif text-sm font-bold drop-shadow-lg">Bali</span>
                  </div>
                </motion.div>

                {/* Image 4 — Bottom-right large */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="absolute bottom-0 right-0 w-[58%] h-[42%] rounded-2xl overflow-hidden shadow-2xl"
                  style={{ border: "1.5px solid rgba(244,63,94,0.2)" }}
                >
                  <img src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=85"
                    alt="Santorini" className="w-full h-full object-cover"
                    style={{ animation: "kenBurns 14s ease-in-out infinite alternate-reverse" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, transparent 50%, rgba(10,18,10,0.75) 100%)" }} />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white font-serif text-base font-bold drop-shadow-lg">Santorini</span>
                    <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">Greece</p>
                  </div>
                </motion.div>

                {/* Center gap accent — glowing dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{ background: "rgba(139,156,134,0.8)", boxShadow: "0 0 20px 8px rgba(139,156,134,0.35)" }} />

                {/* Floating badge — Budget Ready */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-5 -right-6 glass-card-dark rounded-2xl p-3 shadow-2xl z-20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Budget Ready</p>
                      <p className="text-[10px] text-white/50">AI estimated</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating badge — Weather */}
                <motion.div
                  animate={{ y: [0, 9, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  className="absolute -bottom-5 -left-6 glass-card-dark rounded-2xl p-3 shadow-2xl z-20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center">
                      <CloudSun className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Weather Info</p>
                      <p className="text-[10px] text-white/50">Seasonal forecast</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating badge — AI Plan */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  className="absolute top-[44%] -right-8 glass-card-dark rounded-2xl p-3 shadow-2xl z-20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">AI Plan Ready</p>
                      <p className="text-[10px] text-white/50">In 28 seconds</p>
                    </div>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-white/25 text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
              <ChevronDown className="w-4 h-4 text-white/25" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #151f13 0%, #1e2d1b 100%)" }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #8b9c86 1px, transparent 0)",
          backgroundSize: "28px 28px"
        }} />
        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <AnimatedStat key={i} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(139,156,134,0.12)", color: "#6d7c69", border: "1px solid rgba(139,156,134,0.25)" }}>
              Simple Process
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-800 mb-4">From idea to itinerary<br />in 3 steps</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">No complicated forms. No subscriptions needed to start.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(139,156,134,0.4), rgba(139,156,134,0.4), transparent)" }} />

            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="hiw-card text-center relative group"
              >
                <div className="relative inline-block mb-6">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl
                      group-hover:scale-110 transition-transform duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}cc, ${item.color})`,
                      boxShadow: `0 12px 35px ${item.color}40`
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-[10px] font-black flex items-center justify-center shadow-md border-2"
                    style={{ color: item.color, borderColor: item.color }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-14">
            <motion.button
              id="how-it-works-cta"
              onClick={onGetStarted}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary-3d flex items-center gap-2 mx-auto"
            >
              Try It Free <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "#f0ede8" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(139,156,134,0.12)", color: "#6d7c69", border: "1px solid rgba(139,156,134,0.25)" }}>
              Everything Included
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-800 mb-4">Features built for<br />smart travelers</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">All the tools you need, completely free. No hidden fees.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <FeatureCard key={i} feat={feat} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATION SHOWCASE ───────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(139,156,134,0.12)", color: "#6d7c69", border: "1px solid rgba(139,156,134,0.25)" }}>
              Explore
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-800 mb-4">Popular destinations</h2>
            <p className="text-slate-500 text-lg">Join thousands of travelers who've planned trips to these incredible places.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {DESTINATIONS.map((dest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative rounded-3xl overflow-hidden cursor-pointer group shadow-xl"
                style={{ height: "180px" }}
                onClick={onGetStarted}
              >
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${dest.color})` }} />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">{dest.country}</p>
                  <p className="font-serif text-xl font-bold leading-tight">{dest.name}</p>
                </div>
                <div className="absolute top-4 right-4 text-3xl drop-shadow-lg">{dest.emoji}</div>
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/20">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={onExplore || onGetStarted} className="btn-ghost-modern flex items-center gap-2 mx-auto">
              View All Destinations <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "#f0ede8" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(139,156,134,0.12)", color: "#6d7c69", border: "1px solid rgba(139,156,134,0.25)" }}>
              Traveler Reviews
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-800">Loved by travelers worldwide</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className="testimonial-card p-7 relative overflow-hidden"
              >
                {/* Quote mark */}
                <div className="absolute top-4 right-5 text-5xl font-serif text-slate-100 leading-none select-none">"</div>

                <div className="flex gap-0.5 mb-5">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 italic relative z-10">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-5 border-t border-stone-100">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(139,156,134,0.12)", color: "#6d7c69", border: "1px solid rgba(139,156,134,0.25)" }}>
              Pricing
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-slate-800 mb-4">Start free, upgrade when ready</h2>
            <p className="text-slate-500 text-lg">No credit card required. Cancel anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl flex flex-col transition-all ${
                  plan.highlight
                    ? "pricing-card-featured text-white shadow-2xl md:scale-105 z-10 p-6 sm:p-8"
                    : "pricing-card p-6 sm:p-7"
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-black uppercase tracking-wider px-5 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </div>
                    <div className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse at top, rgba(139,156,134,0.08), transparent 60%)" }} />
                  </>
                )}

                <div className="mb-7">
                  <h3 className={`font-serif text-xl font-bold mb-2 ${plan.highlight ? "text-white" : "text-slate-800"}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    {plan.currency && <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-slate-500"}`}>{plan.currency}</span>}
                    <span className={`font-serif text-4xl font-bold ${plan.highlight ? "text-white" : "text-slate-800"}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-slate-500"}`}>/{plan.period}</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.highlight ? "bg-emerald-400/20" : "bg-emerald-50"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlight ? "text-emerald-400" : "text-emerald-600"}`} />
                      </div>
                      <span className={`text-sm ${plan.highlight ? "text-white/85" : "text-slate-600"}`}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={i === 0 ? onGetStarted : onExplorePricing}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
                    plan.highlight
                      ? "bg-white text-slate-800 hover:bg-stone-50 shadow-lg hover:shadow-xl"
                      : i === 0
                        ? "border-2 border-stone-200 text-slate-600 hover:border-sage-color hover:text-sage-color hover:bg-sage-light-bg"
                        : "btn-primary-3d"
                  }`}
                  style={
                    i === 1 && !plan.highlight ? {} :
                    i === 2 ? { background: "linear-gradient(135deg, #8b9c86, #6d7c69)", color: "white" } : {}
                  }
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #0a120a 0%, #1a2318 50%, #0f1a0e 100%)"
      }}>
        {/* Animated particles */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #8b9c86 1px, transparent 0)",
          backgroundSize: "36px 36px"
        }} />

        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,156,134,0.3), transparent 65%)" }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(139,156,134,0.15)", color: "#b5c4b1", border: "1px solid rgba(139,156,134,0.3)" }}>
              Ready to explore?
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Your next adventure
              <br />
              <span className="text-gradient-sage italic">starts here.</span>
            </h2>
            <p className="text-white/55 mb-12 text-lg max-w-xl mx-auto leading-relaxed">
              Join thousands of travelers already using Vagabond to plan smarter, explore further, and spend less.
            </p>
            <motion.button
              id="final-cta"
              onClick={onGetStarted}
              whileHover={{ scale: 1.05, boxShadow: "0 12px 40px rgba(139,156,134,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary-3d text-base flex items-center gap-3 mx-auto px-10 py-4"
            >
              Plan My Trip Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ background: "#060e06" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b pb-10 mb-8"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}
                >
                  <Compass className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <div>
                  <span className="font-serif text-xl font-bold text-white block leading-none">Vagabond</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(139,156,134,0.7)" }}>AI Travel Planner</span>
                </div>
              </div>
              <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>Free Forever Tier · Powered by Gemini AI</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              <button onClick={onGetStarted} className="hover:text-white transition-colors">Plan a Trip</button>
              <button onClick={onExplore || onGetStarted} className="hover:text-white transition-colors">Explore</button>
              <button onClick={onExplorePricing} className="hover:text-white transition-colors">Pricing</button>
              <span style={{ color: "rgba(139,156,134,0.4)" }}>|</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>Leaflet · OpenStreetMap</span>
            </div>
          </div>

          <div className="text-center text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
            <p>© 2026 Vagabond AI Travel Planner. Built with free-tier technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
