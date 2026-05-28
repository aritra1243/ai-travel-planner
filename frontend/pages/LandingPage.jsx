import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass, Sparkles, Map, ArrowRight, Globe, Zap,
  DollarSign, CloudSun, Users, Star, Check, ChevronDown
} from "lucide-react";

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
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Itinerary Builder",
    description: "Powered by Gemini AI, get day-by-day schedules optimized for your travel style, interests, and pace.",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: <Map className="w-6 h-6" />,
    title: "Interactive Maps",
    description: "All your destinations, hotels, and restaurants plotted on free OpenStreetMap. No Google Maps fees.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Smart Budget Estimator",
    description: "AI-powered cost breakdown for accommodation, dining, transport, and activities with money-saving tips.",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: <CloudSun className="w-6 h-6" />,
    title: "Weather Insights",
    description: "Seasonal climate data and packing recommendations so you're always prepared for your destination.",
    color: "bg-sky-100 text-sky-700",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "AI Trip Chat",
    description: "Ask our AI anything about your trip — local tips, restaurant picks, currency, transport advice.",
    color: "bg-rose-100 text-rose-700",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Share & Export",
    description: "Share your itinerary with travel companions via a link, or export it as a beautiful PDF.",
    color: "bg-indigo-100 text-indigo-700",
  },
];

const TESTIMONIALS = [
  { name: "Priya S.", location: "Mumbai", text: "Used Vagabond for my Tokyo trip — it generated a perfect 7-day plan in under 30 seconds. The map feature is incredible!", rating: 5, avatar: "P" },
  { name: "James W.", location: "London", text: "Finally a travel planner that doesn't cost a fortune. The Bali itinerary was spot on and saved me hours of research.", rating: 5, avatar: "J" },
  { name: "Sofia M.", location: "Barcelona", text: "The budget breakdown was incredibly accurate. Planned my Greece trip with exact cost estimates. Love it!", rating: 5, avatar: "S" },
];

const PLANS = [
  { name: "Free", price: "0", period: "forever", features: ["3 AI trips/month", "Interactive maps", "Budget estimator", "Weather insights"], cta: "Get Started Free", highlight: false },
  { name: "Pro", price: "299", period: "month", currency: "INR", features: ["Unlimited AI trips", "AI Chat assistant", "Trip sharing", "Priority generation", "Advanced budget tools"], cta: "Upgrade to Pro", highlight: true },
  { name: "Premium", price: "599", period: "month", currency: "INR", features: ["Everything in Pro", "Multi-destination trips", "Live currency rates", "PDF export", "VIP support"], cta: "Go Premium", highlight: false },
];

export default function LandingPage({ onGetStarted, onExplorePricing, onExplore }) {
  const [activeDestIndex, setActiveDestIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDestIndex((i) => (i + 1) % DESTINATIONS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-hero flex items-center overflow-hidden">

        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,156,134,0.6) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

        {/* Ambient light blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #8b9c86, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float-delayed"
          style={{ background: "radial-gradient(circle, #ebdcb9, transparent)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(139,156,134,0.2)", border: "1px solid rgba(139,156,134,0.4)", color: "#b5c4b1" }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Google Gemini AI
              </motion.div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 tracking-tight">
                Plan your
                <br />
                <span className="text-gradient italic">dream trip</span>
                <br />
                with AI.
              </h1>

              <p className="text-lg text-white/60 mb-10 max-w-lg leading-relaxed">
                Tell us where you want to go. Vagabond crafts a perfect personalized itinerary — with maps, budgets, weather, and day-by-day activities — in under 30 seconds.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  id="hero-get-started"
                  onClick={onGetStarted}
                  className="btn-primary flex items-center gap-2.5 group text-sm"
                >
                  Start Planning for Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onExplore || onGetStarted}
                  className="btn-ghost text-white/80 border-white/20 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  Browse Destinations
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-2">
                  {["A", "B", "C", "D"].map((l, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: `hsl(${120 + i * 30}, 30%, 35%)` }}>{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-white/50 text-xs">10,000+ trips planned</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Destination cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Main featured card */}
              <div className="relative w-full max-w-sm mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDestIndex}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-3xl overflow-hidden shadow-2xl"
                    style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    <img
                      src={DESTINATIONS[activeDestIndex].image}
                      alt={DESTINATIONS[activeDestIndex].name}
                      className="w-full h-72 object-cover"
                    />
                    <div className={`p-5 bg-gradient-to-br ${DESTINATIONS[activeDestIndex].color} backdrop-blur-sm`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white/70 text-xs font-medium mb-0.5">{DESTINATIONS[activeDestIndex].country}</p>
                          <h3 className="text-white font-serif text-2xl font-bold">{DESTINATIONS[activeDestIndex].name}</h3>
                        </div>
                        <span className="text-4xl">{DESTINATIONS[activeDestIndex].emoji}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className="tag-sage text-white/80 bg-white/10 border-white/20">AI Itinerary Ready</span>
                        <span className="tag-sage text-white/80 bg-white/10 border-white/20">Map Included</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Floating mini cards */}
                <div className="absolute -top-6 -right-8 glass rounded-2xl p-3 shadow-xl animate-float"
                  style={{ border: "1px solid rgba(235,220,185,0.3)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Budget Ready</p>
                      <p className="text-[10px] text-slate-500">AI estimated</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-8 glass rounded-2xl p-3 shadow-xl animate-float-delayed"
                  style={{ border: "1px solid rgba(235,220,185,0.3)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
                      <CloudSun className="w-4 h-4 text-sky-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Weather Info</p>
                      <p className="text-[10px] text-slate-500">Seasonal forecast</p>
                    </div>
                  </div>
                </div>

                {/* Destination dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {DESTINATIONS.map((_, i) => (
                    <button key={i} onClick={() => setActiveDestIndex(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeDestIndex ? "w-6 bg-sage" : "w-1.5 bg-white/30"}`}
                      style={{ background: i === activeDestIndex ? "#8b9c86" : "rgba(255,255,255,0.3)" }} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce-gentle">
            <span className="text-white/30 text-xs font-medium">Explore</span>
            <ChevronDown className="w-5 h-5 text-white/30" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, #2d3d2a, #1e2d1b)" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-2 text-sage" style={{ color: "#8b9c86" }}>{stat.icon}</div>
                <div className="text-white font-serif text-3xl font-bold mb-0.5">{stat.value}</div>
                <div className="text-white/50 text-xs font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-sage mb-3 block" style={{ color: "#8b9c86" }}>Simple Process</span>
            <h2 className="font-serif text-4xl font-bold text-slate-800 mb-4">From idea to itinerary in 3 steps</h2>
            <p className="text-slate-500 max-w-xl mx-auto">No complicated forms. No premium subscriptions needed to start. Just tell us where you're going.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #8b9c86, transparent)" }} />

            {[
              { step: "01", title: "Enter Your Destination", desc: "Tell us where you're going, your dates, budget, and travel interests.", icon: <Globe className="w-6 h-6" /> },
              { step: "02", title: "AI Generates Your Plan", desc: "Gemini AI crafts a detailed day-by-day itinerary in under 30 seconds.", icon: <Sparkles className="w-6 h-6" /> },
              { step: "03", title: "Explore & Customize", desc: "View your trip on an interactive map, check budgets, and share with friends.", icon: <Map className="w-6 h-6" /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 mx-auto relative"
                  style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)", boxShadow: "0 8px 25px rgba(139,156,134,0.3)" }}>
                  <div className="text-white">{item.icon}</div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center"
                    style={{ color: "#8b9c86", border: "2px solid #8b9c86" }}>{item.step}</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button id="how-it-works-cta" onClick={onGetStarted} className="btn-primary flex items-center gap-2 mx-auto">
              Try It Free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#f5f1ea" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#8b9c86" }}>Everything Included</span>
            <h2 className="font-serif text-4xl font-bold text-slate-800 mb-4">Features built for smart travelers</h2>
            <p className="text-slate-500 max-w-xl mx-auto">All the tools you need, all completely free. No hidden fees, no API costs passed on to you.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                className="card-premium p-6 group cursor-default"
              >
                <div className={`w-12 h-12 rounded-2xl ${feat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {feat.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-800 mb-2">{feat.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATION SHOWCASE ────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#8b9c86" }}>Explore</span>
            <h2 className="font-serif text-4xl font-bold text-slate-800 mb-4">Popular destinations</h2>
            <p className="text-slate-500">Join thousands of travelers who've already planned trips to these incredible places.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DESTINATIONS.map((dest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                style={{ height: "200px" }}
                onClick={onGetStarted}
              >
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-[10px] font-medium text-white/70">{dest.country}</p>
                  <p className="font-serif text-lg font-bold leading-tight">{dest.name}</p>
                </div>
                <div className="absolute top-3 right-3 text-2xl">{dest.emoji}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button onClick={onExplore || onGetStarted} className="btn-ghost flex items-center gap-2 mx-auto">
              View All Destinations <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "#f5f1ea" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#8b9c86" }}>Traveler Reviews</span>
            <h2 className="font-serif text-4xl font-bold text-slate-800">Loved by travelers worldwide</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card-premium p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: "#8b9c86" }}>Pricing</span>
            <h2 className="font-serif text-4xl font-bold text-slate-800 mb-4">Start free, upgrade when ready</h2>
            <p className="text-slate-500">No credit card required. Cancel anytime.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl p-6 flex flex-col ${plan.highlight
                  ? "bg-hero text-white shadow-2xl scale-105"
                  : "bg-white border border-stone-200 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`font-serif text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-slate-800"}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    {plan.currency && <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-slate-500"}`}>{plan.currency}</span>}
                    <span className={`font-serif text-3xl font-bold ${plan.highlight ? "text-white" : "text-slate-800"}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-white/60" : "text-slate-500"}`}>/{plan.period}</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5">
                      <Check className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-emerald-400" : "text-emerald-500"}`} />
                      <span className={`text-sm ${plan.highlight ? "text-white/80" : "text-slate-600"}`}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={i === 0 ? onGetStarted : onExplorePricing}
                  className={`w-full py-3 rounded-full font-semibold text-sm transition-all ${plan.highlight
                    ? "bg-white text-slate-800 hover:bg-stone-50 shadow-md"
                    : i === 0
                      ? "border-2 border-stone-200 text-slate-700 hover:border-sage hover:text-sage"
                      : "btn-primary"
                  }`}
                  style={!plan.highlight && i !== 0 ? {} : {}}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,156,134,0.8) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
              Your next adventure<br /><span className="text-gradient italic">starts here.</span>
            </h2>
            <p className="text-white/60 mb-10 text-lg">
              Join thousands of travelers already using Vagabond to plan smarter, explore further, and spend less.
            </p>
            <button id="final-cta" onClick={onGetStarted} className="btn-primary text-base flex items-center gap-2.5 mx-auto px-8 py-4">
              Plan My Trip Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0d1a0b" }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b pb-10 mb-8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2.5 justify-center md:justify-start mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#8b9c86" }}>
                  <Compass className="w-5 h-5 text-white animate-spin-slow" />
                </div>
                <span className="font-serif text-xl font-bold text-white">Vagabond</span>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>AI Travel Planner · Free Forever Tier</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <button onClick={onGetStarted} className="hover:text-white transition-colors">Plan a Trip</button>
              <button onClick={onExplore || onGetStarted} className="hover:text-white transition-colors">Explore</button>
              <button onClick={onExplorePricing} className="hover:text-white transition-colors">Pricing</button>
              <span style={{ color: "rgba(139,156,134,0.6)" }}>|</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Powered by Gemini AI · Leaflet · OpenStreetMap</span>
            </div>
          </div>

          <div className="text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            <p>© 2026 Vagabond AI Travel Planner. Built with free-tier technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
