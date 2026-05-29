import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, MapPin, Calendar, DollarSign, Trash2, ArrowRight,
  BookOpen, Crown, Compass, TrendingUp, Globe, Clock,
  SortAsc, Search, Sparkles
} from "lucide-react";

// Destination → Unsplash keyword mapping for card images
import { useTripStore } from "../store/useTripStore";

const getDestinationImage = (destination) => {
  const dest = destination.toLowerCase();
  const keywords = {
    tokyo: "tokyo-japan", paris: "paris-eiffel", bali: "bali-indonesia",
    "new york": "new-york-city", santorini: "santorini-greece", kyoto: "kyoto-japan",
    barcelona: "barcelona-spain", dubai: "dubai-skyline", london: "london-uk",
    role: "role-italy", rome: "rome-italy", istanbul: "istanbul-turkey", maldives: "maldives-beach",
    goa: "goa-india", thailand: "thailand-travel", singapore: "singapore-city"
  };
  for (const [key, val] of Object.entries(keywords)) {
    if (dest.includes(key)) {
      return `https://source.unsplash.com/featured/800x400?${val}`;
    }
  }
  return `https://source.unsplash.com/featured/800x400?travel,${encodeURIComponent(destination.split(",")[0])}`;
};

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "By Budget", value: "budget" },
  { label: "By Destination", value: "destination" },
];

export default function Dashboard({ user, trips, onSelectTrip, onStartGenerator, onDeleteTrip }) {
  const { stats, fetchStats } = useTripStore();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loadingStats, setLoadingStats] = useState(false);

  const freeTierLimit = 3;
  const isFree = user.subscriptionType === "Free";
  // Use backend stats for accurate count (trips prop can be stale/empty on first render)
  const usedTrips = stats?.total_trips ?? stats?.totalTrips ?? trips.length;
  const quotaPercent = isFree ? Math.min((usedTrips / freeTierLimit) * 100, 100) : 100;

  useEffect(() => {
    fetchStats();
  }, [trips, fetchStats]);

  // Filter and sort
  const displayTrips = trips
    .filter(t => !search || t.destination.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "budget") return b.budget - a.budget;
      if (sortBy === "destination") return a.destination.localeCompare(b.destination);
      return 0;
    });

  const statsData = [
    { icon: <BookOpen className="w-5 h-5" />, label: "Trips Planned", value: stats?.totalTrips ?? stats?.total_trips ?? "-", color: "text-violet-600", bg: "bg-violet-50" },
    { icon: <Globe className="w-5 h-5" />, label: "Destinations", value: stats?.uniqueDestinations ?? stats?.unique_destinations ?? "-", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: <Clock className="w-5 h-5" />, label: "Days Planned", value: stats?.totalDaysPlanned ?? stats?.total_days_planned ?? "-", color: "text-amber-600", bg: "bg-amber-50" },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Budget Planned", value: stats ? `${user.preferredCurrency || "INR"} ${(stats.totalBudgetPlanned || stats.total_budget_planned || 0).toLocaleString()}` : "-", color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-6 p-5 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #1a2318 0%, #2d3d2a 60%, #1e2d1b 100%)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
        }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(139,156,134,0.8) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #8b9c86, transparent)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#8b9c86" }}>
              Welcome back
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {usedTrips === 0 ? "Ready for your first adventure?" : `${usedTrips} trip${usedTrips !== 1 ? "s" : ""} planned. Keep exploring!`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            {/* Quota tracker */}
            <div className="rounded-2xl p-3 sm:p-4 flex-1 sm:flex-none sm:min-w-[170px]"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{user.subscriptionType} Plan</span>
              </div>
              <div className="w-full h-2 rounded-full mb-1.5" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${quotaPercent}%`,
                    background: isFree && quotaPercent >= 80 ? "#f59e0b" : "#8b9c86"
                  }}
                />
              </div>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {isFree ? `${usedTrips} / ${freeTierLimit} trips used` : "Unlimited trips"}
              </p>
            </div>

            <button
              onClick={onStartGenerator}
              className="flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 rounded-full text-slate-900 transition-all hover:scale-105 flex-1 sm:flex-none"
              style={{ background: "linear-gradient(135deg, #ebdcb9, #d4c49a)", boxShadow: "0 4px 16px rgba(235,220,185,0.4)" }}
            >
              <Plus className="w-4 h-4" />
              Plan New Trip
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-premium p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              {loadingStats
                ? <div className="skeleton h-6 w-10 mb-1" />
                : <p className="font-serif text-2xl font-bold text-slate-800">{stat.value}</p>
              }
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Trips Section ──────────────────────────────────────────────────── */}
      <div>
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: "#8b9c86" }} />
            <h3 className="font-serif text-xl font-bold text-slate-800">My Travel Journals</h3>
            {trips.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(139,156,134,0.12)", color: "#6d7c69" }}>
                {trips.length}
              </span>
            )}
          </div>

          {trips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-full border border-stone-200 bg-white outline-none focus:border-sage transition-all w-36 sm:w-40 focus:w-44 sm:focus:w-48"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <SortAsc className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="pl-7 pr-3 py-2 text-xs rounded-full border border-stone-200 bg-white outline-none cursor-pointer appearance-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl p-8 sm:p-16 text-center border-2 border-dashed border-stone-200"
            style={{ background: "rgba(250,246,238,0.5)" }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float"
              style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-serif text-xl font-bold text-slate-800 mb-2">Your journal is empty</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-7 leading-relaxed">
              Generate your first AI-powered travel itinerary. Tell us where you want to go and Gemini will plan everything.
            </p>
            <button
              onClick={onStartGenerator}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              Start AI Itinerary Builder
            </button>
          </motion.div>
        ) : (
          <>
            {displayTrips.length === 0 && search && (
              <p className="text-sm text-slate-500 text-center py-8">No trips matching "{search}"</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence>
                {displayTrips.map((trip, idx) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    idx={idx}
                    onSelect={() => onSelectTrip(trip)}
                    onDelete={() => onDeleteTrip(trip.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {isFree && usedTrips >= freeTierLimit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-2xl p-5 flex items-center justify-between gap-4"
                style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "1px solid #fbbf24" }}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-amber-900">Free plan limit reached</p>
                    <p className="text-xs text-amber-700">Upgrade to Pro for unlimited AI itineraries</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.hash = "settings"}
                  className="px-4 py-2 rounded-full text-xs font-bold text-white shrink-0"
                  style={{ background: "#d97706" }}
                >
                  Upgrade Now
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, idx, onSelect, onDelete }) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  const startF = new Date(trip.startDate).toLocaleDateString("en-US", opts);
  const endF = new Date(trip.endDate).toLocaleDateString("en-US", opts);
  const isOverBudget = trip.budgetEstimate?.totalEstimate > trip.budget;
  const daysCount = trip.dailyItinerary?.length || 1;
  const cardImage = getDestinationImage(trip.destination);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: idx * 0.05 }}
      className="card-premium flex flex-col overflow-hidden group"
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-stone-100">
        <img
          src={cardImage}
          alt={trip.destination}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={e => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"; }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)" }}>
          {daysCount} Day{daysCount !== 1 ? "s" : ""}
        </div>

        {trip.travelStyle && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-bold"
            style={{ background: "rgba(139,156,134,0.85)", color: "white", backdropFilter: "blur(6px)" }}>
            {trip.travelStyle}
          </div>
        )}

        {/* Delete btn (hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-2 mb-2">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8b9c86" }} />
          <h4 className="font-serif text-lg font-bold text-slate-800 leading-tight group-hover:text-sage transition-colors"
            style={{ "--tw-text-opacity": 1 }}>
            {trip.destination}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>{startF} — {endF}</span>
        </div>

        {/* Interest tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {trip.interests.slice(0, 3).map((interest, i) => (
            <span key={i} className="tag-sage">{interest}</span>
          ))}
          {trip.interests.length > 3 && (
            <span className="tag-sage" style={{ color: "#8b9c86" }}>+{trip.interests.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>${trip.budget}</span>
            {trip.budgetEstimate && (
              <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isOverBudget ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
              }`}>
                {isOverBudget ? "Over" : "✓ On track"}
              </span>
            )}
          </div>

          <button
            onClick={onSelect}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all group/btn"
            style={{ background: "rgba(139,156,134,0.12)", color: "#5c6d56", border: "1px solid rgba(139,156,134,0.2)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#8b9c86"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,156,134,0.12)"; e.currentTarget.style.color = "#5c6d56"; }}
          >
            View Plan
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
