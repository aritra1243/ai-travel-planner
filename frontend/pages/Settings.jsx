import { useState } from "react";
import { Shield, Check, Heart, Mail, Crown, Sparkles, CreditCard } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

// Dynamically loads the Razorpay JS SDK script once
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Settings({ user, onUpgradeSuccess }) {
  const [activeTab, setActiveTab] = useState("plans");
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const { createPaymentOrder, verifyAndUpgrade, updatePreferences } = useAuthStore();

  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileCurrency, setProfileCurrency] = useState(user?.preferredCurrency || "USD");
  const [profileStyle, setProfileStyle] = useState(user?.travelStyle || "Balanced");
  const [profilePace, setProfilePace] = useState(user?.preferredPace || "Moderate");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    try {
      await updatePreferences({
        name: profileName,
        preferredCurrency: profileCurrency,
        travelStyle: profileStyle,
        preferredPace: profilePace,
        profileImage: profileImage,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpgrade = async (plan) => {
    setLoading(true);
    setPayError("");

    try {
      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        setPayError("Failed to load Razorpay. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 2. Create order on backend
      const order = await createPaymentOrder(plan);

      // 3. Open Razorpay checkout popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Vagabond AI Travel Planner",
        description: `${plan} Plan Subscription`,
        order_id: order.order_id,
        prefill: {
          name: order.user_name || user.name,
          email: order.user_email || user.email,
        },
        theme: { color: "#8b9c86" },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response) => {
          // 4. Payment successful — verify on backend and upgrade
          try {
            const updatedUser = await verifyAndUpgrade({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            });
            onUpgradeSuccess(updatedUser);
          } catch (err) {
            setPayError("Payment was received but verification failed. Contact support with Payment ID: " + response.razorpay_payment_id);
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setPayError("Payment failed: " + response.error.description);
        setLoading(false);
      });
      rzp.open();

    } catch (err) {
      setPayError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 font-sans">
      <div className="flex items-center gap-1.5 text-[#8b9c86] font-bold text-xs uppercase tracking-wider mb-2">
        <Crown className="w-5 h-5 text-amber-500 animate-bounce" />
        <span>Manage Account settings</span>
      </div>
      <h2 className="font-serif text-3xl font-bold text-[#444c41] mb-8">Settings Desk</h2>

      {/* Tabs list */}
      <div className="flex border-b border-stone-200 mb-6 sm:mb-8 gap-2 sm:gap-4 font-sans text-sm overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === "plans" ? "text-[#8b9c86]" : "text-stone-400 hover:text-stone-600"
          }`}
        >
          Subscription & Plans
          {activeTab === "plans" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b9c86]" />}
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === "profile" ? "text-[#8b9c86]" : "text-stone-400 hover:text-stone-600"
          }`}
        >
          My Profile
          {activeTab === "profile" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b9c86]" />}
        </button>
      </div>

      {activeTab === "profile" ? (
        <form onSubmit={handleSaveProfile} className="bg-white border border-[#ebdcb9]/40 p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm w-full max-w-xl">
          <h3 className="font-serif text-lg font-bold text-slate-800 mb-6 border-b pb-3 flex items-center gap-2">
            <Heart className="w-4.5 h-4.5 text-[#8b9c86]" />
            Wanderer Profile
          </h3>

          <div className="flex flex-col gap-6">
            
            {/* Avatar section */}
            <div className="flex items-center gap-5">
              <div className="relative group cursor-pointer select-none">
                <input
                  type="file"
                  id="avatar-uploader"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="avatar-uploader" className="cursor-pointer block">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={profileName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#8b9c86]/30 shadow-md group-hover:opacity-85 transition-all"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b9c86] to-[#6d7c69] flex items-center justify-center text-white font-bold font-serif text-2xl shadow-md border-2 border-white group-hover:scale-102 transition-transform">
                      {profileName ? profileName.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Hover Camera icon */}
                  <div className="absolute inset-0 bg-black/35 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
                  </div>
                </label>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-base mb-1">{profileName || user.name}</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold text-white bg-[#8b9c86] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                    {user.subscriptionType} Plan
                  </span>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileImage("")}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-stone-100 my-1" />

            {/* Profile fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-0.5">Wanderer Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="input-field py-2"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-0.5">Login Email (Permanent)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="input-field py-2 bg-stone-100 text-stone-500 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="h-px bg-stone-100 my-1" />
            <h4 className="text-xs font-bold text-[#8b9c86] uppercase tracking-wider">Travel Preferences</h4>

            {/* Travel pref fields */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-0.5">Currency</label>
                <select
                  value={profileCurrency}
                  onChange={(e) => setProfileCurrency(e.target.value)}
                  className="input-field py-2 cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="SGD">SGD ($)</option>
                  <option value="AED">AED (Dirham)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-0.5">Travel Style</label>
                <select
                  value={profileStyle}
                  onChange={(e) => setProfileStyle(e.target.value)}
                  className="input-field py-2 cursor-pointer"
                >
                  <option value="Balanced">Balanced</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Relaxing">Relaxing</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Foodie">Foodie</option>
                  <option value="Budget">Budget</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 pl-0.5">Preferred Pace</label>
                <select
                  value={profilePace}
                  onChange={(e) => setProfilePace(e.target.value)}
                  className="input-field py-2 cursor-pointer"
                >
                  <option value="Moderate">Moderate</option>
                  <option value="Very Slow">Very Slow</option>
                  <option value="Relaxed">Relaxed</option>
                  <option value="Energetic">Energetic</option>
                  <option value="Packed">Packed</option>
                </select>
              </div>
            </div>

            {/* Notifications and Save button */}
            <div className="mt-4 flex flex-col gap-3">
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Profile details and travel preferences updated successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={saveLoading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold"
              >
                {saveLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating Profile...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </button>
            </div>

          </div>
        </form>
      ) : (
        /* Subscription Pricing Matrix */
        <div className="flex flex-col gap-8">
          <div className="max-w-xl">
            <h3 className="font-serif text-lg font-bold text-[#444c41] mb-2">Upgrade Vagabond</h3>
            <p className="text-xs text-stone-500 leading-relaxed font-sans">
              Indian payment-compliant sandbox setup simulating Razorpay subscriptions seamlessly. Choose a plan to unlock limitless travel generation matrices today!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Free */}
            <div className={`p-6 rounded-2xl border ${
              user.subscriptionType === "Free" 
                ? "bg-[#FAF6EE]/50 border-[#8b9c86] ring-1 ring-[#8b9c86]/20" 
                : "bg-white border-stone-200"
            } flex flex-col justify-between hover:shadow-xs transition-shadow`}>
              <div>
                <span className="text-[10px] font-bold text-[#8b9c86] uppercase tracking-wider block mb-1">Standard</span>
                <h4 className="font-serif text-lg font-bold text-slate-800">Free Tier</h4>
                <div className="my-3 flex items-baseline text-slate-800">
                  <span className="font-serif font-bold text-2xl">INR 0</span>
                  <span className="text-stone-400 text-xs ml-1 font-semibold">/ month</span>
                </div>
                <p className="text-[11px] text-stone-500 mb-6">Enjoy basic AI generation on key routes with standard spacing thresholds.</p>
                <div className="h-px bg-stone-100 mb-4" />
                <ul className="flex flex-col gap-2.5 text-xs text-stone-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Generate up to 3 trips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Interactive Map routes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic saving advice</span>
                  </li>
                </ul>
              </div>
              <button 
                disabled 
                className="w-full py-2.5 rounded-full text-xs font-semibold select-none border border-stone-200 text-stone-400 font-sans"
              >
                {user.subscriptionType === "Free" ? "Current License" : "Free Plan"}
              </button>
            </div>

            {/* Pro */}
            <div className={`p-6 rounded-2xl border relative overflow-hidden ${
              user.subscriptionType === "Pro" 
                ? "bg-[#FAF6EE]/50 border-[#8b9c86] ring-2 ring-[#8b9c86]/20" 
                : "bg-white border-[#ebdcb9] shadow-sm shadow-[#ebdcb9]/15"
            } flex flex-col justify-between hover:shadow-md transition-shadow`}>
              <div className="absolute top-0 right-0 bg-[#8b9c86] text-white text-[9px] font-bold tracking-wider px-3 py-1 rounded-bl uppercase">
                Popular
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Unlimited Planning</span>
                <h4 className="font-serif text-lg font-bold text-slate-800">Pro Explorer</h4>
                <div className="my-3 flex items-baseline text-slate-800">
                  <span className="font-serif font-bold text-2xl">INR 299</span>
                  <span className="text-stone-400 text-xs ml-1 font-semibold">/ month</span>
                </div>
                <p className="text-[11px] text-stone-500 mb-6">Excellent for frequent wanderers who desire endless routes and personalized AI advice.</p>
                <div className="h-px bg-stone-100 mb-4" />
                <ul className="flex flex-col gap-2.5 text-xs text-stone-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[#8b9c86]">Unlimited AI Trips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Fewer transit restrictions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Priority prompt queueing</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleUpgrade("Pro")}
                disabled={user.subscriptionType === "Pro" || loading}
                className={`w-full py-2.5 rounded-full text-xs font-bold transition-all text-center flex items-center justify-center gap-2 ${
                  user.subscriptionType === "Pro"
                    ? "border border-stone-200 text-stone-400"
                    : "bg-[#8b9c86] hover:bg-[#7a8a75] text-white shadow-sm disabled:opacity-60"
                }`}
              >
                {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {user.subscriptionType === "Pro" ? "Current License" : "Upgrade to Pro — ₹299"}
              </button>
            </div>

            {/* Premium */}
            <div className={`p-6 rounded-2xl border ${
              user.subscriptionType === "Premium" 
                ? "bg-[#FAF6EE]/50 border-[#8b9c86] ring-2 ring-[#8b9c86]/20" 
                : "bg-white border-stone-200"
            } flex flex-col justify-between hover:shadow-xs transition-shadow`}>
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">Globetrotter</span>
                <h4 className="font-serif text-lg font-bold text-slate-800">Premium Nomad</h4>
                <div className="my-3 flex items-baseline text-slate-800">
                  <span className="font-serif font-bold text-2xl">INR 599</span>
                  <span className="text-stone-400 text-xs ml-1 font-semibold">/ month</span>
                </div>
                <p className="text-[11px] text-stone-500 mb-6">The definitive global tier. Perfect for multi-country route mapping optimization.</p>
                <div className="h-px bg-stone-100 mb-4" />
                <ul className="flex flex-col gap-2.5 text-xs text-stone-600 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-amber-800">All Pro features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Multi-route optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Interactive currency rates</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={() => handleUpgrade("Premium")}
                disabled={user.subscriptionType === "Premium" || loading}
                className={`w-full py-2.5 rounded-full text-xs font-bold transition-all text-center flex items-center justify-center gap-2 ${
                  user.subscriptionType === "Premium"
                    ? "border border-stone-200 text-stone-400"
                    : "bg-stone-800 hover:bg-stone-900 text-white disabled:opacity-60"
                }`}
              >
                {loading ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {user.subscriptionType === "Premium" ? "Current License" : "Upgrade Premium — ₹599"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay error banner */}
      {payError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold px-5 py-3 rounded-2xl shadow-lg max-w-sm text-center">
          ⚠️ {payError}
          <button onClick={() => setPayError("")} className="ml-3 text-red-400 hover:text-red-700 font-bold">✕</button>
        </div>
      )}
    </div>
  );
}
