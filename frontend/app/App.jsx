import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LandingPage from "../pages/LandingPage";
import Auth from "../pages/Auth";
import Dashboard from "../pages/Dashboard";
import TripGenerator from "../pages/TripGenerator";
import TripDetails from "../pages/TripDetails";
import Settings from "../pages/Settings";
import { Compass } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useTripStore } from "../store/useTripStore";

export default function App() {
  const { user, initSession, logout } = useAuthStore();
  const { trips, selectedTrip, fetchTrips, fetchTripDetails, deleteTrip, fetchStats, setSelectedTrip } = useTripStore();
  const [activeTab, setActiveTab] = useState("landing");
  const [sessionLoading, setSessionLoading] = useState(true);

  // Authenticate user session from localStorage on boot
  useEffect(() => {
    const fetchSession = async () => {
      const token = localStorage.getItem("vagabond_token");
      if (!token) {
        setSessionLoading(false);
        return;
      }

      try {
        const authedUser = await initSession();
        if (authedUser) {
          await fetchTrips();
          await fetchStats();
          setActiveTab("dashboard");
        }
      } catch (e) {
        console.warn("Session validation failed:", e);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSession();
  }, [initSession, fetchTrips, fetchStats]);

  // Handler: After registering or logging in
  const handleAuthSuccess = async (token, authedUser) => {
    await fetchTrips();
    await fetchStats();
    setActiveTab("dashboard");
  };

  // Handler: Handle upgrade subscription (Tier pricing card)
  const handleUpgradeSuccess = (upgradedUser) => {
    // Upgrading subscription is managed within useAuthStore
  };

  // Handler: Archiving/Deleting trip from directory
  const handleDeleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip itinerary?")) {
      return;
    }

    try {
      await deleteTrip(tripId);
      await fetchStats();
    } catch (e) {
      alert(e.message || "Cannot delete travel journal");
    }
  };

  // Handler: Trip Generator Success Callback
  const handleTripGenerated = async (newTrip) => {
    await fetchStats();
    setActiveTab("trip-details");
  };

  // Handler: Logout out of Vagabond
  const handleLogout = () => {
    logout();
    useTripStore.setState({ trips: [], selectedTrip: null, stats: null });
    setActiveTab("landing");
  };

  // Render App Content base on states
  const renderContent = () => {
    if (sessionLoading) {
      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-[#fdfbf7]">
          <Compass className="w-10 h-10 text-[#8b9c86] animate-spin -mb-1" />
          <span className="text-xs font-semibold text-stone-500 font-serif tracking-wider pt-4 animate-pulse">
            Settle in...
          </span>
        </div>
      );
    }

    switch (activeTab) {
      case "explore":
      case "landing":
        return (
          <LandingPage 
            onGetStarted={() => {
              if (user) {
                setActiveTab("dashboard");
              } else {
                setActiveTab("register");
              }
            }} 
            onExplorePricing={() => {
              if (user) {
                setActiveTab("settings");
              } else {
                setActiveTab("login");
              }
            }}
          />
        );
      
      case "login":
        return (
          <Auth 
            type="login" 
            onAuthSuccess={handleAuthSuccess} 
            onBack={() => setActiveTab("landing")}
            onToggleType={() => setActiveTab("register")}
          />
        );
      
      case "register":
        return (
          <Auth 
            type="register" 
            onAuthSuccess={handleAuthSuccess} 
            onBack={() => setActiveTab("landing")}
            onToggleType={() => setActiveTab("login")}
          />
        );

      case "dashboard":
        if (!user) return <LandingPage onGetStarted={() => setActiveTab("register")} onExplorePricing={() => setActiveTab("login")} />;
        return (
          <Dashboard 
            user={user}
            trips={trips}
            onSelectTrip={async (trip) => {
              // Fetch full trip details (list view only has lightweight data)
              const fullTrip = await fetchTripDetails(trip.id);
              if (fullTrip) setActiveTab("trip-details");
            }}
            onStartGenerator={() => setActiveTab("trip-generator")}
            onDeleteTrip={handleDeleteTrip}
          />
        );

      case "trip-generator":
        if (!user) return <LandingPage onGetStarted={() => setActiveTab("register")} onExplorePricing={() => setActiveTab("login")} />;
        return (
          <TripGenerator 
            user={user}
            onBack={() => setActiveTab("dashboard")}
            onTripGenerated={handleTripGenerated}
          />
        );

      case "trip-details":
        if (!user) return <LandingPage onGetStarted={() => setActiveTab("register")} onExplorePricing={() => setActiveTab("login")} />;
        if (!selectedTrip) {
          setActiveTab("dashboard");
          return null;
        }
        return (
          <TripDetails 
            trip={selectedTrip}
            onBack={() => {
              setSelectedTrip(null);
              setActiveTab("dashboard");
            }}
          />
        );

      case "settings":
        if (!user) return <LandingPage onGetStarted={() => setActiveTab("register")} onExplorePricing={() => setActiveTab("login")} />;
        return (
          <Settings 
            user={user}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        );

      default:
        return <LandingPage onGetStarted={() => setActiveTab("register")} onExplorePricing={() => setActiveTab("login")} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fdfbf7] selection:bg-[#ebdcb9]/50 selection:text-slate-900 leading-relaxed font-sans">
      <Navbar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      <main className={`flex-1 ${["landing", "explore"].includes(activeTab) ? "" : "pb-16"}`}>
        {renderContent()}
      </main>
    </div>
  );
}
