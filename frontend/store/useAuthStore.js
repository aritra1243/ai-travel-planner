import { create } from "zustand";
import { api } from "../services/api";

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    subscriptionType: user.subscriptionType || user.subscription_type || "Free",
    subscriptionExpiresAt: user.subscriptionExpiresAt || user.subscription_expires_at,
    preferredCurrency: user.preferredCurrency || user.preferred_currency || "USD",
    travelStyle: user.travelStyle || user.travel_style || "Balanced",
    preferredPace: user.preferredPace || user.preferred_pace || "Moderate",
    profileImage: user.profileImage || user.profile_image || "",
    isVerified: user.isVerified || user.is_verified || false,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
  };
};

const mapPreferencesToBackend = (prefs) => {
  if (!prefs) return {};
  return {
    name: prefs.name,
    preferred_currency: prefs.preferredCurrency || prefs.preferred_currency,
    travel_style: prefs.travelStyle || prefs.travel_style,
    preferred_pace: prefs.preferredPace || prefs.preferred_pace,
    profile_image: prefs.profileImage || prefs.profile_image,
  };
};

export const useAuthStore = create((set, get) => {
  // Listen for session expiry event from the API client
  if (typeof window !== "undefined") {
    window.addEventListener("vagabond-logout", () => {
      get().logout();
    });
  }

  return {
    user: null,
    token: null,
    loading: false,
    error: null,

    // Initial session loading
    initSession: async () => {
      const token = localStorage.getItem("vagabond_token");
      if (!token) return null;

      set({ loading: true, token, error: null });
      try {
        const userData = await api.get("/api/auth/me/");
        const normalized = normalizeUser(userData);
        set({ user: normalized, loading: false });
        return normalized;
      } catch (err) {
        // Stale token, clear it
        localStorage.removeItem("vagabond_token");
        set({ user: null, token: null, loading: false });
        return null;
      }
    },

    // Login
    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post("/api/auth/login/", { email, password });
        localStorage.setItem("vagabond_token", data.access);
        const normalized = normalizeUser(data.user);
        set({ user: normalized, token: data.access, loading: false });
        return normalized;
      } catch (err) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    // Register
    register: async (name, email, password) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post("/api/auth/register/", { name, email, password });
        localStorage.setItem("vagabond_token", data.access);
        const normalized = normalizeUser(data.user);
        set({ user: normalized, token: data.access, loading: false });
        return normalized;
      } catch (err) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    // Logout
    logout: () => {
      localStorage.removeItem("vagabond_token");
      set({ user: null, token: null, error: null });
    },

    // Update Travel Preferences
    updatePreferences: async (preferences) => {
      set({ loading: true, error: null });
      try {
        const payload = mapPreferencesToBackend(preferences);
        const data = await api.put("/api/auth/preferences/", payload);
        const userData = data.user || data;
        const normalized = normalizeUser(userData);
        set({ user: normalized, loading: false });
        return normalized;
      } catch (err) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    // Step 1: Create a Razorpay order on the backend
    createPaymentOrder: async (plan) => {
      const data = await api.post("/api/payments/create-order/", { plan });
      return data; // { order_id, amount, currency, key_id, plan, user_email, user_name }
    },

    // Step 2: Verify payment signature and upgrade subscription
    verifyAndUpgrade: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post("/api/payments/verify/", {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          plan,
        });
        const normalized = normalizeUser(data.user);
        set({ user: normalized, loading: false });
        return normalized;
      } catch (err) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },

    // Legacy: kept for backward compatibility (unused after real integration)
    upgradeSubscription: async (plan, paymentId) => {
      set({ loading: true, error: null });
      try {
        const data = await api.post("/api/auth/upgrade/", { plan, payment_id: paymentId });
        const userData = data.user || data;
        const normalized = normalizeUser(userData);
        set({ user: normalized, loading: false });
        return normalized;
      } catch (err) {
        set({ error: err.message, loading: false });
        throw err;
      }
    },
  };
});
