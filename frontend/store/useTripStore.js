import { create } from "zustand";
import { api } from "../services/api";

// Translates Django snake_case model keys into frontend camelCase types
const normalizeTrip = (t) => {
  if (!t) return null;
  return {
    id: t.id,
    destination: t.destination,
    destinationLat: t.destination_lat,
    destinationLng: t.destination_lng,
    startDate: t.start_date,
    endDate: t.end_date,
    budget: Number(t.budget),
    currency: t.currency,
    interests: t.interests || [],
    travelStyle: t.travel_style,
    pace: t.pace,
    accommodation: t.accommodation,
    createdAt: t.created_at,
    isPublic: t.is_public,
    shareToken: t.share_token,
    notes: t.notes || "",
    
    // Day plans
    dailyItinerary: (t.daily_itinerary || []).map((day) => ({
      dayNumber: day.day_number,
      theme: day.theme,
      notes: day.notes || "",
      isTravelDay: day.is_travel_day || false,
      transportSummary: day.transport_summary || "",
      estimatedDailyCost: Number(day.estimated_daily_cost || 0),
      activities: (day.activities || []).map((act) => ({
        id: act.id,
        timeOfDay: act.time_of_day,
        activityName: act.activity_name,
        description: act.description || "",
        estimatedCost: act.estimated_cost || "",
        transportInfo: act.transport_info || "",
        bookingTip: act.booking_tip || "",
        localTip: act.local_tip || "",
        duration: act.duration || "",
        order: act.order,
      })),
    })),

    // Places
    places: (t.places || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      description: p.description || "",
      priceRange: p.price_range || "",
      rating: p.rating ? Number(p.rating) : null,
      order: p.order,
    })),

    // Budget breakdown
    budgetEstimate: {
      accommodation: Number(t.budget_breakdown?.accommodation || 0),
      dining: Number(t.budget_breakdown?.dining || 0),
      transport: Number(t.budget_breakdown?.transport || 0),
      activities: Number(t.budget_breakdown?.activities || 0),
      contingency: Number(t.budget_breakdown?.contingency || 0),
      totalEstimate: Number(t.total_estimated_cost || 0),
      savingTips: t.saving_tips || "",
    },

    // Weather forecast
    weatherForecast: {
      averageTemp: t.weather_avg_temp || "N/A",
      condition: t.weather_condition || "N/A",
      recommendations: t.weather_recommendations || "",
      bestMonths: t.weather_best_months || "",
    },
  };
};

export const useTripStore = create((set, get) => ({
  trips: [],
  selectedTrip: null,
  stats: null,
  loading: false,
  error: null,

  // Set selected trip directly
  setSelectedTrip: (trip) => set({ selectedTrip: trip }),

  // Get user trips
  fetchTrips: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/api/trips/");
      // DRF ListAPIView returns paginated { count, next, previous, results: [...] }
      // Handle both paginated and plain array responses
      const rawTrips = Array.isArray(response)
        ? response
        : (response?.results ?? response ?? []);
      const trips = rawTrips.map(normalizeTrip);
      set({ trips, loading: false });
      return trips;
    } catch (err) {
      set({ error: err.message, loading: false });

      return [];
    }
  },

  // Get single trip details
  fetchTripDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const t = await api.get(`/api/trips/${id}/`);
      const trip = normalizeTrip(t);
      set({ selectedTrip: trip, loading: false });
      return trip;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // Generate new trip with Gemini
  generateTrip: async (tripData) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        destination: tripData.destination,
        starting_location: tripData.startingLocation || tripData.starting_location || "",
        start_date: tripData.startDate || tripData.start_date,
        end_date: tripData.endDate || tripData.end_date,
        budget: Number(tripData.budget),
        currency: tripData.currency,
        interests: tripData.interests,
        travel_style: tripData.travelStyle || tripData.travel_style,
        pace: tripData.pace,
        accommodation: tripData.accommodation,
      };

      const resTrip = await api.post("/api/ai/generate/", payload);
      const trip = normalizeTrip(resTrip);
      set((state) => ({
        trips: [trip, ...state.trips],
        selectedTrip: trip,
        loading: false,
      }));
      return trip;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Delete trip
  deleteTrip: async (id) => {
    try {
      await api.delete(`/api/trips/${id}/`);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== id),
        selectedTrip: state.selectedTrip?.id === id ? null : state.selectedTrip,
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  // Share trip (makes public and returns link token)
  shareTrip: async (id) => {
    try {
      const data = await api.post(`/api/trips/${id}/share/`);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? { ...t, shareToken: data.share_token, isPublic: true } : t)),
        selectedTrip: state.selectedTrip?.id === id ? { ...state.selectedTrip, shareToken: data.share_token, isPublic: true } : state.selectedTrip,
      }));
      return data;
    } catch (err) {
      throw err;
    }
  },

  // unshare trip
  unshareTrip: async (id) => {
    try {
      await api.delete(`/api/trips/${id}/share/`);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? { ...t, shareToken: null, isPublic: false } : t)),
        selectedTrip: state.selectedTrip?.id === id ? { ...state.selectedTrip, shareToken: null, isPublic: false } : state.selectedTrip,
      }));
      return true;
    } catch (err) {
      throw err;
    }
  },

  // Get user stats
  fetchStats: async () => {
    try {
      const stats = await api.get("/api/auth/stats/");
      set({ stats });
      return stats;
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
      return null;
    }
  },

  // Send message to AI trip chatbot assistant
  sendChatMessage: async (tripId, message) => {
    try {
      const data = await api.post(`/api/ai/chat/${tripId}/`, { message });
      return data.reply;
    } catch (err) {
      throw err;
    }
  },
}));
