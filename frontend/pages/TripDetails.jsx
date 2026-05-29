import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Compass, Printer, MapPin, Calendar, DollarSign,
  CloudSun, Sparkles, Building, Utensils, Landmark, Share2,
  CheckCircle, Copy, ChevronLeft, ChevronRight, Thermometer,
  Package, Plane, Train, Info, Lightbulb, Star, Clock,
  Navigation, ArrowRight, Globe, Home, Camera, Luggage,
  AlertCircle, CheckSquare, Coffee, Car, Shield
} from "lucide-react";
import MyMap from "../components/MyMap";
import AIChatPanel from "../components/AIChatPanel";
import { useTripStore } from "../store/useTripStore";

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const TIME_COLORS = {
  morning:   { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", label: "Morning"   },
  afternoon: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6", label: "Afternoon" },
  evening:   { bg: "#f3e8ff", text: "#6b21a8", dot: "#9333ea", label: "Evening"   },
  night:     { bg: "#1e293b", text: "#e2e8f0", dot: "#64748b", label: "Night"     },
};

function getTimeStyle(timeOfDay = "") {
  const t = timeOfDay.toLowerCase();
  if (t.includes("morn"))  return TIME_COLORS.morning;
  if (t.includes("after")) return TIME_COLORS.afternoon;
  if (t.includes("eve"))   return TIME_COLORS.evening;
  if (t.includes("night")) return TIME_COLORS.night;
  return TIME_COLORS.afternoon;
}

function getActivityMeta(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hotel") || n.includes("check") || n.includes("lodge") || n.includes("hostel") || n.includes("checkout") || n.includes("stay"))
    return { Icon: Building, color: "#10b981", bg: "#d1fae5", imgKeyword: "hotel+luxury", type: "accommodation" };
  if (n.includes("lunch") || n.includes("dinner") || n.includes("breakfast") || n.includes("restaurant") || n.includes("café") || n.includes("cafe") || n.includes("food") || n.includes("market"))
    return { Icon: Utensils, color: "#f59e0b", bg: "#fef3c7", imgKeyword: "food+restaurant", type: "dining" };
  if (n.includes("flight") || n.includes("depart") || n.includes("airport") || n.includes("airline"))
    return { Icon: Plane, color: "#6366f1", bg: "#e0e7ff", imgKeyword: "airport+terminal", type: "travel" };
  if (n.includes("train") || n.includes("station") || n.includes("rail"))
    return { Icon: Train, color: "#8b5cf6", bg: "#ede9fe", imgKeyword: "train+station", type: "travel" };
  if (n.includes("arrive") || n.includes("arrival") || n.includes("transfer"))
    return { Icon: Navigation, color: "#0ea5e9", bg: "#e0f2fe", imgKeyword: "city+arrival", type: "transit" };
  if (n.includes("museum") || n.includes("gallery") || n.includes("art"))
    return { Icon: Landmark, color: "#8b9c86", bg: "#f0f4ef", imgKeyword: "museum+interior", type: "culture" };
  if (n.includes("market") || n.includes("shopping") || n.includes("souvenir"))
    return { Icon: Compass, color: "#ec4899", bg: "#fce7f3", imgKeyword: "market+bazaar", type: "shopping" };
  if (n.includes("sunset") || n.includes("viewpoint") || n.includes("panorama"))
    return { Icon: Camera, color: "#f97316", bg: "#ffedd5", imgKeyword: "sunset+viewpoint", type: "sightseeing" };
  if (n.includes("breakfast") || n.includes("coffee") || n.includes("café"))
    return { Icon: Coffee, color: "#a16207", bg: "#fef9c3", imgKeyword: "coffee+cafe", type: "dining" };
  return { Icon: Landmark, color: "#8b9c86", bg: "#f0f4ef", imgKeyword: "travel+sightseeing", type: "sightseeing" };
}

function StarRating({ rating }) {
  const full = Math.floor(rating || 0);
  const half = (rating || 0) - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="w-3 h-3"
          style={{ color: i < full ? "#f59e0b" : "#d1d5db", fill: i < full ? "#f59e0b" : "none" }}
        />
      ))}
      <span className="text-[10px] text-slate-500 ml-1">{(rating || 0).toFixed(1)}</span>
    </span>
  );
}

// Activity image using Unsplash keyword
function ActivityImage({ keyword, activityName }) {
  const src = `https://source.unsplash.com/featured/600x200?${encodeURIComponent(keyword)}`;
  return (
    <div className="relative h-36 overflow-hidden rounded-t-xl">
      <img src={src} alt={activityName}
        className="w-full h-full object-cover"
        onError={e => { e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80"; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}

// Step-by-step guide items
function GuideStep({ number, icon: Icon, iconColor, title, detail }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
        style={{ background: iconColor }}>
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-700 mb-0.5">{title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TripDetails({ trip, onBack }) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [placesFilter, setPlacesFilter] = useState("all");
  const [expandedActivities, setExpandedActivities] = useState({});
  const dayScrollRef = useRef(null);

  const opts = { month: "short", day: "numeric", year: "numeric" };
  const startF = new Date(trip.startDate).toLocaleDateString("en-US", opts);
  const endF   = new Date(trip.endDate).toLocaleDateString("en-US", opts);
  const activeDay = trip.dailyItinerary[activeDayIndex] || trip.dailyItinerary[0];
  const isOverBudget = trip.budgetEstimate?.totalEstimate > trip.budget;
  const currency = trip.currency || "USD";
  const totalDays = trip.dailyItinerary.length;

  // Extract starting location from Day 1 data
  const originCity = (() => {
    const d1 = trip.dailyItinerary[0];
    if (d1?.isTravelDay && d1?.transportSummary) {
      // Try "Flight {origin} to {dest}" pattern
      const match = d1.transportSummary.match(/^(?:Flight|Train|Bus)\s+(.+?)\s+to\s+/i);
      if (match) return match[1].trim();
    }
    if (d1?.isTravelDay && d1?.theme) {
      // Try "Departure from {origin}" pattern
      const match2 = d1.theme.match(/Departure from\s+(.+?)\s+(?:&|and)/i);
      if (match2) return match2[1].trim();
    }
    // Check first activity name
    const firstAct = d1?.activities?.[0];
    if (firstAct?.activityName) {
      const match3 = firstAct.activityName.match(/Depart from\s+(.+)$/i);
      if (match3) return match3[1].trim();
    }
    return "";
  })();

  const handleShare = async () => {
    setShareLoading(true);
    try {
      const data = await useTripStore.getState().shareTrip(trip.id);
      setShareUrl(`${window.location.origin}/shared/${data.share_token}`);
    } catch { alert("Could not generate share link."); }
    setShareLoading(false);
  };

  const copyShare = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollDays = (dir) => {
    dayScrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  const goToDay = (i) => {
    setActiveDayIndex(i);
    const btn = dayScrollRef.current?.children[i];
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const toggleActivity = (dayIdx, actIdx) => {
    const key = `${dayIdx}-${actIdx}`;
    setExpandedActivities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredPlaces = trip.places.filter(p => {
    if (placesFilter === "all") return true;
    const cat = (p.category || "").toLowerCase();
    if (placesFilter === "hotels") return cat.includes("hotel") || cat.includes("hostel") || cat.includes("accommodation");
    if (placesFilter === "dining") return cat.includes("restaurant") || cat.includes("food") || cat.includes("cafe") || cat.includes("dining");
    if (placesFilter === "attractions") return !cat.includes("hotel") && !cat.includes("restaurant") && !cat.includes("food") && !cat.includes("cafe");
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4 md:px-6 print:p-0" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <button onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-full border border-stone-200 bg-white transition-all shadow-sm hover:shadow-md">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleShare} disabled={shareLoading || !!shareUrl}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 bg-white text-slate-600 hover:border-sage transition-all shadow-sm disabled:opacity-60">
            {shareLoading ? <Compass className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            {shareUrl ? "Link Ready!" : "Share Trip"}
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-stone-200 bg-white text-slate-600 hover:border-sage transition-all shadow-sm">
            <Printer className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      {/* Share URL toast */}
      <AnimatePresence>
        {shareUrl && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-5 flex items-center gap-3 p-4 rounded-2xl text-sm print:hidden"
            style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-emerald-700 text-xs flex-1 truncate">{shareUrl}</p>
            <button onClick={copyShare}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white shrink-0"
              style={{ background: "#10b981" }}>
              <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-6">
        <div className="h-52 relative overflow-hidden">
          <img
            src={`https://source.unsplash.com/featured/1400x500?${encodeURIComponent(trip.destination.split(",")[0])},travel`}
            alt={trip.destination}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"; }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,26,11,0.88), rgba(30,40,26,0.68))" }} />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,156,134,0.8) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        </div>
        <div className="absolute inset-0 flex items-end pb-4 sm:pb-6 px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between w-full gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ background: "rgba(235,220,185,0.25)", color: "#ebdcb9", border: "1px solid rgba(235,220,185,0.3)", backdropFilter: "blur(8px)" }}>
                <Compass className="w-3 h-3" /> Round-Trip Itinerary
              </div>
              {/* Route: Origin → Destination → Origin */}
              {originCity && (
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <span className="flex items-center gap-1.5 text-white/80 text-sm font-semibold">
                    <Home className="w-4 h-4 text-indigo-400" /> {originCity}
                  </span>
                  <div className="flex items-center gap-1 text-indigo-300">
                    <div className="w-5 h-px bg-indigo-400/60" /><Plane className="w-4 h-4" /><div className="w-5 h-px bg-indigo-400/60" />
                  </div>
                  <span className="text-white font-bold text-sm">{trip.destination.split(",")[0]}</span>
                  <div className="flex items-center gap-1 text-emerald-300">
                    <div className="w-5 h-px bg-emerald-400/60" /><ArrowRight className="w-3.5 h-3.5" /><div className="w-5 h-px bg-emerald-400/60" />
                  </div>
                  <span className="flex items-center gap-1.5 text-white/80 text-sm font-semibold">
                    <Home className="w-4 h-4 text-emerald-400" /> {originCity}
                  </span>
                </div>
              )}
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white mb-2">{trip.destination}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{startF} — {endF}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{totalDays} days</span>
                <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" />{currency} {trip.budget.toLocaleString()}</span>
                {trip.travelStyle && <span className="px-2.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.12)" }}>{trip.travelStyle}</span>}
              </div>
            </div>
            <div className="shrink-0 rounded-2xl p-3 sm:p-4 w-full md:w-auto md:min-w-[160px]"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <span className="text-[9px] text-white/60 font-semibold uppercase tracking-wider block mb-1">AI Cost Estimate</span>
              <span className="font-serif text-2xl font-bold text-amber-200">{currency} {trip.budgetEstimate.totalEstimate.toLocaleString()}</span>
              <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min((trip.budgetEstimate.totalEstimate / Math.max(trip.budget, 1)) * 100, 100)}%`,
                  background: isOverBudget ? "#f87171" : "#34d399"
                }} />
              </div>
              <span className={`text-[10px] font-semibold block mt-1 ${isOverBudget ? "text-red-300" : "text-emerald-300"}`}>
                {isOverBudget ? "⚠ Slightly over budget" : "✓ Within budget"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL-WIDTH ROUTE MAP ──────────────────────────────────────────────── */}
      <div className="mb-8 print:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" style={{ color: "#8b9c86" }} />
            <h3 className="font-serif text-lg font-bold text-slate-800">Interactive Journey Map</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {originCity && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 inline-block rounded" style={{ background: "#6366f1", borderTop: "2px dashed #6366f1" }} /> Outbound
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 inline-block rounded" style={{ borderTop: "2px dashed #10b981" }} /> Return
                </span>
              </>
            )}
            <span className="text-[10px] font-medium bg-stone-100 px-2 py-1 rounded-full">Scroll to zoom · Click markers</span>
          </div>
        </div>
        <MyMap
          places={trip.places}
          destination={trip.destination}
          originCity={originCity}
          interactive={true}
          height="300px"
        />
        <style>{"@media (min-width: 640px) { .map-responsive { height: 420px !important; } } @media (min-width: 1024px) { .map-responsive { height: 520px !important; } }"}</style>
      </div>

      {/* ── Journey Overview Strip ────────────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm print:hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: "#8b9c86" }} />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Journey Overview</span>
          <span className="ml-auto text-[10px] text-slate-400">{totalDays} days total</span>
        </div>
        <div className="flex overflow-x-auto scrollbar-none px-4 py-3 gap-1">
          {trip.dailyItinerary.map((day, i) => (
            <button key={i} onClick={() => goToDay(i)}
              className="shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-stone-50 group">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm transition-all ${i === activeDayIndex ? "scale-110 ring-2 ring-offset-1" : "group-hover:scale-105"}`}
                style={{
                  background: day.isTravelDay
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : i === activeDayIndex ? "linear-gradient(135deg, #8b9c86, #6d7c69)" : "#d1d5db",
                  ringColor: day.isTravelDay ? "#6366f1" : "#8b9c86",
                }}>
                {day.isTravelDay ? (i === 0 ? "✈" : "🏠") : day.dayNumber}
              </div>
              <span className="text-[9px] font-semibold text-center leading-tight max-w-[64px]"
                style={{ color: i === activeDayIndex ? "#6d7c69" : "#94a3b8" }}>
                Day {day.dayNumber}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 px-5 py-2 border-t border-stone-100 bg-stone-50">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }} />
            <span className="text-[10px] text-slate-500 font-medium">Travel Day (flight/transit)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#8b9c86]" />
            <span className="text-[10px] text-slate-500 font-medium">Exploration Day</span>
          </div>
        </div>
      </div>

      {/* ── Day Planner + Side Panel ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6 mb-6 sm:mb-8 items-start">

        {/* Left: Day Planner */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Day Selector Tabs */}
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => scrollDays(-1)}
              className="shrink-0 w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center text-slate-500 hover:border-sage transition-all shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div ref={dayScrollRef} className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none flex-1">
              {trip.dailyItinerary.map((day, i) => (
                <button key={day.dayNumber} onClick={() => goToDay(i)}
                  className={`shrink-0 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all border-2 ${
                    activeDayIndex === i
                      ? "text-white border-transparent shadow-md"
                      : day.isTravelDay
                        ? "text-indigo-600 border-indigo-200 bg-indigo-50 hover:border-indigo-300"
                        : "text-slate-600 border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                  style={activeDayIndex === i
                    ? { background: day.isTravelDay ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#8b9c86,#6d7c69)" }
                    : {}}>
                  {day.isTravelDay && <span className="mr-1">{i === 0 ? "✈" : "🏠"}</span>}
                  Day {day.dayNumber}
                </button>
              ))}
            </div>
            <button onClick={() => scrollDays(1)}
              className="shrink-0 w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center text-slate-500 hover:border-sage transition-all shadow-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Active Day Panel */}
          <AnimatePresence mode="wait">
            {activeDay && (
              <motion.div key={activeDayIndex}
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22 }}
                className="card-premium overflow-hidden">

                {/* Day Header */}
                <div className={`px-6 py-5 ${activeDay.isTravelDay ? "" : "border-b border-stone-100"}`}
                  style={activeDay.isTravelDay
                    ? { background: "linear-gradient(135deg,#eef2ff,#f5f3ff)", borderBottom: "2px solid #e0e7ff" }
                    : { background: "#fafaf9" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                        style={{ color: activeDay.isTravelDay ? "#6366f1" : "#8b9c86" }}>
                        DAY {activeDay.dayNumber} OF {totalDays} · {activeDay.isTravelDay ? "TRAVEL DAY ✈" : "EXPLORATION DAY"}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-slate-800 leading-tight mb-1">{activeDay.theme}</h3>
                      {activeDay.transportSummary && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 mt-1">
                          <Plane className="w-3.5 h-3.5" /> {activeDay.transportSummary}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Day Budget</p>
                        <p className="font-serif text-base font-bold text-slate-700">{currency} {activeDay.estimatedDailyCost?.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => goToDay(Math.max(0, activeDayIndex - 1))} disabled={activeDayIndex === 0}
                          className="w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center text-slate-500 hover:border-sage disabled:opacity-30 transition-all">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => goToDay(Math.min(totalDays - 1, activeDayIndex + 1))} disabled={activeDayIndex === totalDays - 1}
                          className="w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center text-slate-500 hover:border-sage disabled:opacity-30 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activities List */}
                <div className="px-5 py-5 overflow-y-auto" style={{ maxHeight: "75vh" }}>
                  <div className="flex flex-col gap-4">
                    {activeDay.activities.map((act, i) => {
                      const { Icon, color, bg, imgKeyword, type } = getActivityMeta(act.activityName);
                      const timeStyle = getTimeStyle(act.timeOfDay);
                      const key = `${activeDayIndex}-${i}`;
                      const isExpanded = expandedActivities[key];
                      const stepNum = i + 1;

                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-shadow bg-white">

                          {/* Activity Image */}
                          <ActivityImage keyword={imgKeyword} activityName={act.activityName} />

                          {/* Step number badge over image */}
                          <div className="relative">
                            <div className="absolute -top-12 left-4 z-10">
                              <div className="w-10 h-10 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: color, border: "3px solid white" }}>
                                <Icon className="w-5 h-5" />
                              </div>
                            </div>
                          </div>

                          {/* Main content */}
                          <div className="px-5 pt-4 pb-3">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: timeStyle.bg, color: timeStyle.text }}>
                                {act.timeOfDay}
                              </span>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: bg, color }}>
                                Step {stepNum}
                              </span>
                              {act.estimatedCost && (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                  style={{ background: "rgba(139,156,134,0.12)", color: "#5c6d56" }}>
                                  {act.estimatedCost}
                                </span>
                              )}
                              {act.duration && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{act.duration}
                                </span>
                              )}
                            </div>

                            <h4 className="font-serif text-lg font-bold text-slate-800 mb-1.5 leading-tight">{act.activityName}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">{act.description}</p>

                            {/* Transport Info */}
                            {act.transportInfo && (
                              <div className="flex items-start gap-2.5 mb-3 p-3 rounded-xl"
                                style={{ background: "rgba(139,156,134,0.07)", border: "1px solid rgba(139,156,134,0.2)" }}>
                                <Car className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8b9c86" }} />
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">How to Get There</p>
                                  <p className="text-xs font-semibold text-slate-700">{act.transportInfo}</p>
                                </div>
                              </div>
                            )}

                            {/* Expand/Collapse for full guide */}
                            <button onClick={() => toggleActivity(activeDayIndex, i)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{ background: isExpanded ? bg : "rgba(139,156,134,0.06)", color: isExpanded ? color : "#6d7c69", border: `1px solid ${isExpanded ? color + "40" : "rgba(139,156,134,0.15)"}` }}>
                              <span>{isExpanded ? "Hide Detailed Guide" : "📖 Show Full Journey Guide"}</span>
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                            </button>
                          </div>

                          {/* Expanded Journey Guide */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden">
                                <div className="px-5 pb-5 border-t border-stone-100"
                                  style={{ background: "#fafaf9" }}>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3">Step-by-Step Journey Guide</p>

                                  <div className="flex flex-col gap-4">

                                    {/* Step 1: Preparation */}
                                    <GuideStep number="1" icon={Shield} iconColor="#6366f1"
                                      title="Before You Go — Preparation"
                                      detail={act.bookingTip || "Check timings and availability online before heading out. Keep digital copies of all tickets on your phone."} />

                                    {/* Step 2: Getting there */}
                                    <GuideStep number="2" icon={Car} iconColor="#f59e0b"
                                      title="Getting There"
                                      detail={act.transportInfo || "Use local transport or pre-booked transfer. Allow extra time during peak hours."} />

                                    {/* Step 3: What to do */}
                                    <GuideStep number="3" icon={CheckSquare} iconColor="#10b981"
                                      title="At the Destination"
                                      detail={act.description || "Follow the local guidelines and enjoy the experience at your own pace."} />

                                    {/* Step 4: Local insider tip */}
                                    {act.localTip && (
                                      <GuideStep number="4" icon={Lightbulb} iconColor="#f97316"
                                        title="Local Insider Tip"
                                        detail={act.localTip} />
                                    )}

                                    {/* Step 5: What to carry */}
                                    <div className="p-3 rounded-xl"
                                      style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Luggage className="w-3.5 h-3.5" /> What to Carry
                                      </p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {(type === "travel" ? ["📱 E-ticket", "🛂 Passport", "💰 Local cash", "🔋 Power bank", "🧳 Luggage"] :
                                          type === "accommodation" ? ["📋 Booking confirmation", "🪪 ID proof", "💳 Credit card", "📱 Hotel app"] :
                                          type === "dining" ? ["💰 Cash (some places)", "📸 Camera", "😋 Appetite!", "💳 Card as backup"] :
                                          ["🗺 Map/offline maps", "💧 Water bottle", "☀️ Sunscreen", "👟 Comfortable shoes", "📸 Camera"]
                                        ).map(item => (
                                          <span key={item} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                                            style={{ background: "rgba(99,102,241,0.1)", color: "#4338ca" }}>
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Booking tip box */}
                                    {act.bookingTip && (
                                      <div className="flex items-start gap-3 p-3 rounded-xl"
                                        style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                          <Info className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Booking Tip</p>
                                          <p className="text-xs text-slate-600 leading-relaxed">{act.bookingTip}</p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Getting to next stop */}
                                    {i < activeDay.activities.length - 1 && (
                                      <div className="flex items-start gap-3 p-3 rounded-xl"
                                        style={{ background: "rgba(139,156,134,0.07)", border: "1px solid rgba(139,156,134,0.2)" }}>
                                        <ArrowRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8b9c86" }} />
                                        <div>
                                          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#6d7c69" }}>Next Up</p>
                                          <p className="text-xs text-slate-600">After this, head to: <strong>{activeDay.activities[i + 1]?.activityName}</strong></p>
                                          {activeDay.activities[i + 1]?.transportInfo && (
                                            <p className="text-[11px] text-slate-500 mt-0.5">🚌 {activeDay.activities[i + 1].transportInfo}</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side Panel: Weather + Places */}
        <div className="lg:col-span-4 flex flex-col gap-5 print:hidden">

          {/* Weather */}
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-500" />
                <h4 className="font-serif text-sm font-bold text-slate-700">Weather & Packing</h4>
              </div>
              <span className="text-sm font-bold text-slate-700 bg-stone-100 px-3 py-1 rounded-full">
                {trip.weatherForecast.averageTemp}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="p-3 rounded-xl" style={{ background: "#f5f1ea", border: "1px solid rgba(235,220,185,0.3)" }}>
                <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                  <Thermometer className="w-3.5 h-3.5" /><span className="font-semibold">Conditions</span>
                </div>
                <p className="text-slate-700 font-medium">{trip.weatherForecast.condition}</p>
              </div>
              {trip.weatherForecast.bestMonths && (
                <div className="p-3 rounded-xl" style={{ background: "#f5f1ea", border: "1px solid rgba(235,220,185,0.3)" }}>
                  <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /><span className="font-semibold">Best Time</span>
                  </div>
                  <p className="text-slate-700 font-medium">{trip.weatherForecast.bestMonths}</p>
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(139,156,134,0.06)", border: "1px solid rgba(139,156,134,0.15)" }}>
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color: "#6d7c69" }}>
                <Package className="w-3.5 h-3.5" /><span className="font-bold">Packing Tips</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{trip.weatherForecast.recommendations}</p>
            </div>
          </div>

          {/* Key Places with filter */}
          <div className="card-premium p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: "#8b9c86" }} />
                Key Places ({trip.places.length})
              </h4>
            </div>
            <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none">
              {[["all", "All"], ["hotels", "🏨"], ["dining", "🍴"], ["attractions", "🗺"]].map(([val, label]) => (
                <button key={val} onClick={() => setPlacesFilter(val)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                    placesFilter === val ? "text-white border-transparent" : "text-slate-500 border-stone-200 bg-white hover:border-stone-300"
                  }`}
                  style={placesFilter === val ? { background: "linear-gradient(135deg,#8b9c86,#6d7c69)" } : {}}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-0 max-h-[400px] overflow-y-auto">
              {filteredPlaces.map((place, i) => {
                const catLower = (place.category || "").toLowerCase();
                const isHotel = catLower.includes("hotel") || catLower.includes("accommodation") || catLower.includes("hostel");
                const isDining = catLower.includes("restaurant") || catLower.includes("food") || catLower.includes("cafe") || catLower.includes("dining");
                const IconEl = isHotel ? Building : isDining ? Utensils : Landmark;
                const bg2 = isHotel ? "#10b981" : isDining ? "#f59e0b" : "#8b9c86";
                return (
                  <div key={i} className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm" style={{ background: bg2 }}>
                      <IconEl className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate mb-0.5">{place.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mb-1">{place.description}</p>
                      {place.rating && <StarRating rating={place.rating} />}
                    </div>
                    {place.priceRange && (
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">{place.priceRange}</span>
                    )}
                  </div>
                );
              })}
              {filteredPlaces.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No {placesFilter} in this itinerary.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget Breakdown ──────────────────────────────────────────────────── */}
      <div className="card-premium p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 print:border print:border-stone-300">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-stone-100">
          <DollarSign className="w-5 h-5" style={{ color: "#8b9c86" }} />
          <h3 className="font-serif text-lg font-bold text-slate-800">Budget Breakdown</h3>
          <span className="ml-auto text-sm font-bold" style={{ color: isOverBudget ? "#ef4444" : "#10b981" }}>
            {currency} {trip.budgetEstimate.totalEstimate.toLocaleString()} total
          </span>
        </div>
        <div className="grid md:grid-cols-12 gap-5 sm:gap-8 items-start">
          <div className="md:col-span-7 flex flex-col gap-4">
            {[
              { label: "Accommodation",           key: "accommodation", color: "#10b981", icon: "🏨" },
              { label: "Food & Dining",            key: "dining",        color: "#f59e0b", icon: "🍽️" },
              { label: "Transport (incl. flights)", key: "transport",     color: "#6366f1", icon: "✈️" },
              { label: "Activities & Entry",       key: "activities",    color: "#8b9c86", icon: "🎭" },
              { label: "Contingency Buffer",       key: "contingency",   color: "#d97706", icon: "🛡️" },
            ].map(({ label, key, color, icon }) => {
              const amount = trip.budgetEstimate[key] || 0;
              const pct = Math.min((amount / Math.max(trip.budgetEstimate.totalEstimate, 1)) * 100, 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span className="flex items-center gap-1.5"><span>{icon}</span>{label}</span>
                    <span>{currency} {amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#f0ede8" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full" style={{ background: color }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 text-right">{pct.toFixed(0)}% of total</div>
                </div>
              );
            })}
          </div>
          <div className="md:col-span-5 rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "#f8f6f2", border: "1px solid rgba(235,220,185,0.3)" }}>
            <h4 className="font-serif text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" /> AI Money-Saving Tips
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">"{trip.budgetEstimate.savingTips}"</p>
            <div className="pt-3 border-t border-stone-200 text-[10px] text-slate-400 leading-relaxed">
              💡 Estimates are AI-generated based on seasonal averages. Always verify prices locally before booking.
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel tripId={trip.id} destination={trip.destination} />
    </div>
  );
}
