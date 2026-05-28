import { useState, useEffect } from "react";
import { Compass, Settings as SettingsIcon, LogOut, Plus, Globe, Menu, X, Bell, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Navbar({ user, activeTab, setActiveTab, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHeroPage = activeTab === "landing";
  const isFreeNearLimit = user?.subscriptionType === "Free";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on tab change
  useEffect(() => setMobileOpen(false), [activeTab]);

  const headerClass = isHeroPage
    ? scrolled
      ? "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 shadow-sm"
      : "absolute top-0 left-0 right-0 z-50 bg-transparent border-transparent"
    : "sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-200/60 shadow-sm";

  const logoTextColor = isHeroPage && !scrolled ? "text-white" : "text-slate-800";
  const logoSubColor = isHeroPage && !scrolled ? "text-sage-light" : "text-sage";

  return (
    <>
      <header
        className={`transition-all duration-300 py-3 px-6 ${headerClass}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Brand */}
          <div
            onClick={() => user ? setActiveTab("dashboard") : setActiveTab("landing")}
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)", boxShadow: "0 4px 12px rgba(139,156,134,0.35)" }}
            >
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <span className={`font-serif text-lg font-bold tracking-tight block leading-none ${logoTextColor}`}>
                Vagabond
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest block" style={{ color: "#8b9c86" }}>
                AI Travel Planner
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <NavBtn
                  label="Dashboard"
                  active={["dashboard", "trip-details"].includes(activeTab)}
                  onClick={() => setActiveTab("dashboard")}
                  isHero={isHeroPage && !scrolled}
                />
                <NavBtn
                  label="Explore"
                  active={activeTab === "explore"}
                  onClick={() => setActiveTab("explore")}
                  isHero={isHeroPage && !scrolled}
                />
                <NavBtn
                  label="Settings"
                  icon={<SettingsIcon className="w-3.5 h-3.5" />}
                  active={activeTab === "settings"}
                  onClick={() => setActiveTab("settings")}
                  isHero={isHeroPage && !scrolled}
                />

                {/* Plan trip CTA */}
                <button
                  onClick={() => setActiveTab("trip-generator")}
                  className="ml-2 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)", boxShadow: "0 4px 12px rgba(139,156,134,0.35)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Plan Trip
                </button>

                <div className="w-px h-5 bg-stone-200 mx-2" />

                {/* Quota bell (free tier) */}
                {isFreeNearLimit && (
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="relative p-2 rounded-full hover:bg-amber-50 transition-colors"
                    title="Upgrade your plan"
                  >
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                  </button>
                )}

                {/* Profile */}
                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate block">{user.name}</span>
                    <span className="text-[9px] font-bold uppercase" style={{ color: "#8b9c86" }}>{user.subscriptionType}</span>
                  </div>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-[#8b9c86]/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm"
                      style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={onLogout}
                    title="Logout"
                    className="p-1.5 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-500 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavBtn label="Explore" active={activeTab === "explore"} onClick={() => setActiveTab("explore")} isHero={isHeroPage && !scrolled} />
                <button
                  onClick={() => setActiveTab("login")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${isHeroPage && !scrolled ? "text-white/80 hover:text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-900 hover:bg-stone-100"}`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className="ml-1 px-5 py-2 text-sm font-semibold rounded-full text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)", boxShadow: "0 4px 12px rgba(139,156,134,0.3)" }}
                >
                  Start Free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl transition-all"
            style={{ background: isHeroPage && !scrolled ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen
              ? <X className={`w-5 h-5 ${isHeroPage && !scrolled ? "text-white" : "text-slate-700"}`} />
              : <Menu className={`w-5 h-5 ${isHeroPage && !scrolled ? "text-white" : "text-slate-700"}`} />
            }
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[60px] z-40 bg-white border-b border-stone-200 shadow-xl px-6 py-4 flex flex-col gap-1 md:hidden"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {user ? (
              <>
                {/* Profile strip */}
                <div className="flex items-center gap-3 p-3 rounded-2xl mb-2" style={{ background: "#f5f1ea" }}>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-md border border-[#8b9c86]/20" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #8b9c86, #6d7c69)" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: "#8b9c86" }}>
                      <Crown className="w-3 h-3" /> {user.subscriptionType} Plan
                    </p>
                  </div>
                </div>

                <MobileNavBtn label="Dashboard" onClick={() => setActiveTab("dashboard")} active={activeTab === "dashboard"} />
                <MobileNavBtn label="Plan New Trip" onClick={() => setActiveTab("trip-generator")} highlight />
                <MobileNavBtn label="Explore Destinations" onClick={() => setActiveTab("explore")} />
                <MobileNavBtn label="Settings" onClick={() => setActiveTab("settings")} />
                <div className="h-px bg-stone-100 my-1" />
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </>
            ) : (
              <>
                <MobileNavBtn label="Explore Destinations" onClick={() => setActiveTab("explore")} />
                <MobileNavBtn label="Log In" onClick={() => setActiveTab("login")} />
                <MobileNavBtn label="Start Free" onClick={() => setActiveTab("register")} highlight />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavBtn({ label, active, onClick, icon, isHero }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? "bg-sage/10 text-sage font-semibold"
          : isHero
            ? "text-white/70 hover:text-white hover:bg-white/10"
            : "text-slate-600 hover:text-slate-900 hover:bg-stone-100"
      }`}
      style={active ? { color: "#6d7c69", background: "rgba(139,156,134,0.12)" } : {}}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavBtn({ label, onClick, active, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        highlight
          ? "text-white"
          : active
            ? "bg-sage/10 text-sage"
            : "text-slate-700 hover:bg-stone-50"
      }`}
      style={highlight ? { background: "linear-gradient(135deg, #8b9c86, #6d7c69)" } : active ? { color: "#6d7c69", background: "rgba(139,156,134,0.1)" } : {}}
    >
      {label}
    </button>
  );
}
