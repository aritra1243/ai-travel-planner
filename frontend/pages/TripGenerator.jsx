import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass, Sparkles, MapPin, Calendar, DollarSign,
  ArrowLeft, Heart, CheckCircle2, Loader2, ChevronDown,
  Search, X, Navigation, LocateFixed
} from "lucide-react";
import { useTripStore } from "../store/useTripStore";

const INTEREST_PRESETS = [
  { label: "Local Food & Cuisine", emoji: "🍜" },
  { label: "Temples & History", emoji: "⛩️" },
  { label: "Hiking & Nature", emoji: "🥾" },
  { label: "Beach & Sunshine", emoji: "🏖️" },
  { label: "Art & Museums", emoji: "🎨" },
  { label: "Cozy Cafes", emoji: "☕" },
  { label: "Spas & Wellness", emoji: "🧘" },
  { label: "Anime & Pop Culture", emoji: "🎌" },
  { label: "Photography", emoji: "📸" },
  { label: "Gardens & Parks", emoji: "🌸" },
  { label: "Nightlife & Music", emoji: "🎵" },
  { label: "Shopping & Markets", emoji: "🛍️" },
];

const TRAVEL_STYLES = [
  { label: "Adventure", emoji: "🧗", desc: "Thrilling & Active" },
  { label: "Relaxing", emoji: "🌅", desc: "Slow & Peaceful" },
  { label: "Cultural", emoji: "🏛️", desc: "History & Arts" },
  { label: "Foodie", emoji: "🍽️", desc: "Culinary Journey" },
  { label: "Budget", emoji: "💰", desc: "Cost-Effective" },
  { label: "Luxury", emoji: "✨", desc: "Premium Comfort" },
];

const ACCOMMODATION_TYPES = ["Hostel", "Budget Hotel", "Hotel", "Boutique Hotel", "Luxury Resort", "Airbnb/Homestay"];
const PACE_LABELS = ["Very Slow", "Relaxed", "Moderate", "Energetic", "Packed"];
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR", "AUD", "CAD", "SGD", "AED"];

const LOADING_MESSAGES = [
  "Analyzing your trip preferences...",
  "Crafting your personalized day-by-day schedule...",
  "Locating top hotels, restaurants, and attractions...",
  "Checking seasonal weather conditions...",
  "Plotting locations on the map...",
  "Calculating realistic budget estimates...",
  "Adding local tips and hidden gems...",
  "Almost ready — polishing your itinerary...",
];

const LOADING_STEPS = [
  { label: "Analyzing destination", done: false },
  { label: "Building daily schedule", done: false },
  { label: "Plotting map locations", done: false },
  { label: "Estimating budget", done: false },
  { label: "Finalizing itinerary", done: false },
];

export default function TripGenerator({ user, onBack, onTripGenerated }) {
  const [startingLocation, setStartingLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState(1500);
  const [currency, setCurrency] = useState("USD");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [customInterest, setCustomInterest] = useState("");
  const [travelStyle, setTravelStyle] = useState("Relaxing");
  const [accommodation, setAccommodation] = useState("Hotel");
  const [pace, setPace] = useState(2); // 0-4
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [loadingSteps, setLoadingSteps] = useState(LOADING_STEPS.map(s => ({ ...s })));

  // Autocomplete state for starting location
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [showStartSugg, setShowStartSugg] = useState(false);
  const startRef = useRef(null);

  // Autocomplete state for destination
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggRef = useRef(null);

  // ── Geolocation auto-detect ─────────────────────────────────────────────────
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const country = data.address?.country || "";
          const label = [city, country].filter(Boolean).join(", ");
          setStartingLocation(label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch {
          setError("Could not fetch your location name. Please type it manually.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setError("Location access denied. Please type your starting city.");
        else setError("Unable to detect location. Please type it manually.");
      },
      { timeout: 10000 }
    );
  };

  // Nominatim autocomplete for starting location
  useEffect(() => {
    if (startingLocation.length < 3) { setStartSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(startingLocation)}&format=json&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await r.json();
        const places = data.map(p => {
          const parts = p.display_name.split(", ");
          return parts.slice(0, 2).join(", ");
        });
        setStartSuggestions([...new Set(places)].slice(0, 5));
        setShowStartSugg(true);
      } catch { setStartSuggestions([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [startingLocation]);

  // Nominatim autocomplete for destination
  useEffect(() => {
    if (destination.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await r.json();
        const places = data.map(p => {
          const parts = p.display_name.split(", ");
          return parts.slice(0, 2).join(", ");
        });
        setSuggestions([...new Set(places)].slice(0, 5));
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [destination]);

  // Click outside to close suggestion dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (suggRef.current && !suggRef.current.contains(e.target)) setShowSuggestions(false);
      if (startRef.current && !startRef.current.contains(e.target)) setShowStartSugg(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Rotate messages during loading
  useEffect(() => {
    if (!loading) { setMsgIdx(0); return; }
    const i = setInterval(() => setMsgIdx(m => (m + 1) % LOADING_MESSAGES.length), 3000);
    // Simulate progress steps
    const stepTimers = LOADING_STEPS.map((_, idx) =>
      setTimeout(() => {
        setLoadingSteps(prev => prev.map((s, si) => si <= idx ? { ...s, done: true } : s));
      }, idx * 4500 + 2000)
    );
    return () => { clearInterval(i); stepTimers.forEach(t => clearTimeout(t)); };
  }, [loading]);

  const toggleInterest = (label) => {
    setSelectedInterests(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    );
  };

  const { generateTrip } = useTripStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destination.trim()) { setError("Please enter a destination city."); return; }
    if (!startDate || !endDate) { setError("Please select departure and return dates."); return; }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Departure date must be before your return date.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingSteps(LOADING_STEPS.map(s => ({ ...s, done: false })));

    try {
      const newTrip = await generateTrip({
        destination: destination.trim(),
        startingLocation: startingLocation.trim() || "Not specified",
        startDate, endDate,
        budget: Number(budget),
        currency,
        interests: selectedInterests.length > 0 ? selectedInterests : ["Sightseeing"],
        travelStyle,
        pace: PACE_LABELS[pace],
        accommodation
      });

      onTripGenerated(newTrip);
    } catch (err) {
      setError(err.message || "Something went wrong. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // ── Loading Screen ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-hero relative overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,156,134,0.8) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float"
          style={{ background: "radial-gradient(circle, #8b9c86, transparent)" }} />

        <div className="relative z-10 text-center max-w-md">
          {/* Compass spinner */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-sage/20" style={{ borderColor: "rgba(139,156,134,0.2)" }} />
            <div className="absolute inset-0 rounded-full border-2 border-t-sage border-l-sage/40 animate-spin"
              style={{ borderColor: "rgba(139,156,134,0.3)", borderTopColor: "#8b9c86" }} />
            <div className="absolute inset-4 rounded-full border-2 border-t-warm/60 animate-spin"
              style={{ borderColor: "transparent", borderTopColor: "#ebdcb9", animationDuration: "1.5s", animationDirection: "reverse" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="w-10 h-10 text-white animate-pulse" style={{ color: "#b5c4b1" }} />
            </div>
          </div>

          <h3 className="font-serif text-2xl font-bold text-white mb-2">Building your itinerary</h3>
          <p className="text-xs font-mono mb-8 animate-fade-in" style={{ color: "rgba(255,255,255,0.5)" }}>
            {LOADING_MESSAGES[msgIdx]}
          </p>

          {/* Progress steps */}
          <div className="flex flex-col gap-2 text-left w-full">
            {loadingSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${step.done ? "opacity-100" : "opacity-40"}`}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${step.done ? "" : ""}`}
                  style={{ background: step.done ? "#8b9c86" : "rgba(255,255,255,0.1)" }}>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="w-1.5 h-1.5 rounded-full bg-white/30" />}
                </div>
                <span className="text-xs font-medium text-white">{step.label}</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
            This can take 15–30 seconds. Our AI is crafting your perfect trip!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-full border border-stone-200 bg-white transition-all mb-6 shadow-sm">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#8b9c86" }}>AI Trip Planner</span>
        </div>
        <h2 className="font-serif text-3xl font-bold text-slate-800 mb-1">Where are you headed?</h2>
        <p className="text-sm text-slate-500">Tell us about your dream trip and we'll create a perfect itinerary.</p>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-2xl mb-6 text-sm"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <Compass className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-red-700 block">Generation Error</span>
            <p className="text-red-600 mt-0.5 text-xs">{error}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── Trip Basics ────────────────────────────────────────────────────── */}
        <div className="card-premium p-6">
          <h3 className="font-serif text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: "#8b9c86" }} /> Trip Basics
          </h3>

          {/* ── Starting Location ── */}
          <div className="mb-5" ref={startRef}>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5 pl-1">Starting Location</label>
            <div className="relative">
              <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Mumbai, India or New Delhi"
                value={startingLocation}
                onChange={e => { setStartingLocation(e.target.value); setShowStartSugg(true); }}
                onFocus={() => startSuggestions.length > 0 && setShowStartSugg(true)}
                className="input-field pl-11 pr-24 sm:pr-32"
              />
              {/* Auto-detect button */}
              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={locating}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)", color: "#fff" }}
                title="Detect my current location"
              >
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <LocateFixed className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{locating ? "Locating…" : "Use GPS"}</span>
              </button>

              {startingLocation && !locating && (
                <button type="button"
                  onClick={() => { setStartingLocation(""); setStartSuggestions([]); }}
                  className="absolute right-20 sm:right-28 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Start suggestions dropdown */}
              <AnimatePresence>
                {showStartSugg && startSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {startSuggestions.map((s, i) => (
                      <button key={i} type="button"
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                        onClick={() => { setStartingLocation(s); setShowStartSugg(false); }}>
                        <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 pl-1">Where your journey begins — helps calculate travel routes and costs.</p>
          </div>

          {/* ── Destination ── */}
          <div className="mb-5" ref={suggRef}>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5 pl-1">Destination City *</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Tokyo, Japan or Florence, Italy"
                value={destination}
                onChange={e => { setDestination(e.target.value); setShowSuggestions(true); }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="input-field pl-11"
              />
              {destination && (
                <button type="button" onClick={() => { setDestination(""); setSuggestions([]); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Destination suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl z-20 overflow-hidden"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {suggestions.map((s, i) => (
                      <button key={i} type="button"
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                        onClick={() => { setDestination(s); setShowSuggestions(false); }}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5 pl-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" style={{ color: "#8b9c86" }} /> Departure Date *
              </label>
              <input type="date" required value={startDate} min={today}
                onChange={e => setStartDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5 pl-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" style={{ color: "#8b9c86" }} /> Return Date *
              </label>
              <input type="date" required value={endDate} min={startDate || today}
                onChange={e => setEndDate(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Budget + Currency */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1.5 pl-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" style={{ color: "#8b9c86" }} /> Total Budget *
              </label>
              <div className="relative">
                <input type="number" required min="100" max="100000" value={budget}
                  onChange={e => setBudget(Number(e.target.value))} className="input-field pr-16" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="text-xs font-bold text-slate-500 bg-transparent border-0 outline-none cursor-pointer appearance-none pr-4"
                    style={{ fontFamily: "'Inter', sans-serif" }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <input type="range" min="100" max="10000" step="100" value={Math.min(budget, 10000)}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full mt-2 accent-sage" style={{ accentColor: "#8b9c86" }} />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>{currency} 100</span><span>{currency} 10,000+</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5 pl-1">Accommodation</label>
              <select value={accommodation} onChange={e => setAccommodation(e.target.value)}
                className="input-field appearance-none cursor-pointer" style={{ fontFamily: "'Inter', sans-serif" }}>
                {ACCOMMODATION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Travel Style ─────────────────────────────────────────────────── */}
        <div className="card-premium p-6">
          <h3 className="font-serif text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#8b9c86" }} /> Your Travel Style
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
            {TRAVEL_STYLES.map(s => (
              <button key={s.label} type="button" onClick={() => setTravelStyle(s.label)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  travelStyle === s.label
                    ? "border-sage scale-[1.02] shadow-sm"
                    : "border-stone-200 hover:border-stone-300"
                }`}
                style={travelStyle === s.label ? { borderColor: "#8b9c86", background: "rgba(139,156,134,0.06)" } : {}}>
                <span className="text-2xl block mb-1.5">{s.emoji}</span>
                <p className="text-xs font-bold text-slate-800">{s.label}</p>
                <p className="text-[10px] text-slate-500">{s.desc}</p>
              </button>
            ))}
          </div>

          {/* Pace slider */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-3 pl-1">
              Trip Pace: <span className="font-bold" style={{ color: "#8b9c86" }}>{PACE_LABELS[pace]}</span>
            </label>
            <input type="range" min="0" max="4" step="1" value={pace}
              onChange={e => setPace(Number(e.target.value))}
              className="w-full mb-1" style={{ accentColor: "#8b9c86" }} />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>😌 Very Slow</span><span>⚡ Packed</span>
            </div>
          </div>
        </div>

        {/* ── Interests ────────────────────────────────────────────────────── */}
        <div className="card-premium p-6">
          <h3 className="font-serif text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: "#8b9c86" }} /> Travel Interests
            <span className="text-xs font-normal text-slate-400">(select any)</span>
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {INTEREST_PRESETS.map(({ label, emoji }) => {
              const active = selectedInterests.includes(label);
              return (
                <button key={label} type="button" onClick={() => toggleInterest(label)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border-2 transition-all font-medium ${
                    active ? "scale-105 shadow-sm" : "border-stone-200 text-slate-600 hover:border-stone-300"
                  }`}
                  style={active ? { borderColor: "#8b9c86", background: "rgba(139,156,134,0.1)", color: "#5c6d56" } : {}}>
                  <span>{emoji}</span>{label}
                  {active && <CheckCircle2 className="w-3 h-3" style={{ color: "#8b9c86" }} />}
                </button>
              );
            })}
          </div>

          {/* Custom interest */}
          <div className="flex gap-2 w-full sm:max-w-sm">
            <input type="text" placeholder="Add custom interest..." value={customInterest}
              onChange={e => setCustomInterest(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); if (customInterest.trim()) { toggleInterest(customInterest.trim()); setCustomInterest(""); } }
              }}
              className="input-field flex-1 text-xs py-2" />
            <button type="button"
              onClick={() => { if (customInterest.trim()) { toggleInterest(customInterest.trim()); setCustomInterest(""); } }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: "#8b9c86" }}>
              Add
            </button>
          </div>
        </div>

        {/* Quota info for free users */}
        {user.subscriptionType === "Free" && (
          <div className="flex items-start gap-3 p-4 rounded-2xl text-sm"
            style={{ background: "#fffbeb", border: "1px solid #fcd34d" }}>
            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-800 block text-xs">Free Plan Note</span>
              <p className="text-amber-700 text-xs mt-0.5">
                This trip uses 1 of your 3 monthly free slots. Upgrade to Pro in Settings for unlimited trips.
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" id="generate-trip-btn"
          className="btn-primary w-full py-4 flex items-center justify-center gap-2.5 text-base font-bold">
          <Sparkles className="w-5 h-5" />
          Generate My Itinerary
        </button>
      </form>
    </div>
  );
}
