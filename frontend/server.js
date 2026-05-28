import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── DB Setup ──────────────────────────────────────────────────────────────

let db = { users: [], trips: [] };

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } else {
      saveDB();
    }
  } catch (error) {
    console.error("Error reading database file, using in-memory:", error);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

loadDB();

// ─── JWT Helpers ─────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "vagabond-travel-planner-secret-key-2026";

function generateToken(userId, email) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ userId, email, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signatureInput = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(signatureInput).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (decodedPayload.exp < Date.now()) return null;
    return { userId: decodedPayload.userId, email: decodedPayload.email };
  } catch {
    return null;
  }
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ─── Gemini Client ────────────────────────────────────────────────────────────

let aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️  GEMINI_API_KEY env variable is not defined. AI requests will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" }
      }
    });
  }
  return aiClient;
}

// ─── Rate limiter (simple in-memory) ─────────────────────────────────────────

const requestCounts = new Map();

function rateLimit(userId, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const record = requestCounts.get(userId);
  if (!record || record.resetAt < now) {
    requestCounts.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}

// ─── Popular Destinations ─────────────────────────────────────────────────────

const POPULAR_DESTINATIONS = [
  { name: "Tokyo, Japan", emoji: "🗼", tag: "Anime & Culture", bestSeason: "Spring", avgBudget: 1800, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80", lat: 35.6762, lng: 139.6503 },
  { name: "Paris, France", emoji: "🗺️", tag: "Romance & Art", bestSeason: "Summer", avgBudget: 2200, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80", lat: 48.8566, lng: 2.3522 },
  { name: "Bali, Indonesia", emoji: "🌴", tag: "Beach & Wellness", bestSeason: "Dry Season", avgBudget: 900, image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80", lat: -8.3405, lng: 115.0920 },
  { name: "New York, USA", emoji: "🗽", tag: "Urban & Food", bestSeason: "Fall", avgBudget: 2500, image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80", lat: 40.7128, lng: -74.0060 },
  { name: "Santorini, Greece", emoji: "🏛️", tag: "Islands & Views", bestSeason: "Summer", avgBudget: 2000, image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80", lat: 36.3932, lng: 25.4615 },
  { name: "Kyoto, Japan", emoji: "⛩️", tag: "History & Temples", bestSeason: "Spring/Autumn", avgBudget: 1600, image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80", lat: 35.0116, lng: 135.7681 },
  { name: "Barcelona, Spain", emoji: "🎨", tag: "Architecture & Nightlife", bestSeason: "Spring", avgBudget: 1700, image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=800&q=80", lat: 41.3851, lng: 2.1734 },
  { name: "Dubai, UAE", emoji: "🌆", tag: "Luxury & Desert", bestSeason: "Winter", avgBudget: 2800, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80", lat: 25.2048, lng: 55.2708 },
  { name: "Goa, India", emoji: "🌊", tag: "Beach & Relaxation", bestSeason: "Winter", avgBudget: 500, image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80", lat: 15.2993, lng: 74.1240 },
  { name: "Istanbul, Turkey", emoji: "🕌", tag: "History & Food", bestSeason: "Spring", avgBudget: 1100, image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80", lat: 41.0082, lng: 28.9784 },
  { name: "Maldives", emoji: "🐠", tag: "Luxury Beach", bestSeason: "Dry Season", avgBudget: 3500, image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80", lat: 3.2028, lng: 73.2207 },
  { name: "Rome, Italy", emoji: "🏟️", tag: "History & Cuisine", bestSeason: "Spring", avgBudget: 1900, image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80", lat: 41.9028, lng: 12.4964 },
];

// ─── Start Server ─────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();

  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Body parser (run early so both proxy and mock endpoints have access to req.body without stream errors)
  app.use(express.json({ limit: "2mb" }));

  // ─── Django Reverse Proxy ──────────────────────────────────────────────────
  const proxyToDjango = (req, res, next) => {
    const options = {
      hostname: "127.0.0.1",
      port: 8000,
      path: req.originalUrl,
      method: req.method,
      headers: { ...req.headers },
    };

    if (options.headers.host) {
      options.headers.host = "127.0.0.1:8000";
    }

    // Re-serialize parsed req.body since body-parser already consumed the stream
    let bodyData = null;
    if (req.body && Object.keys(req.body).length > 0) {
      bodyData = JSON.stringify(req.body);
      options.headers["content-length"] = Buffer.byteLength(bodyData);
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT") {
        console.log(`[Proxy] Django backend offline (${err.code}). Falling back to local mock API.`);
        next();
      } else {
        console.error("[Proxy] Unexpected error:", err);
        res.status(500).json({ error: "Proxy connection error", details: err.message });
      }
    });

    if (bodyData) {
      proxyReq.write(bodyData);
      proxyReq.end();
    } else {
      req.pipe(proxyReq, { end: true });
    }
  };

  // Intercept all /api/ routes
  app.use("/api", (req, res, next) => {
    proxyToDjango(req, res, next);
  });

  // Authentication Middleware
  const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authentication credentials provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired session token" });
    }
    req.user = decoded;
    next();
  };

  // ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields: name, email, password" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = db.users.find(u => u.email === trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: "Email address is already registered" });
    }

    const newUser = {
      id: "u_" + crypto.randomUUID(),
      name: name.trim(),
      email: trimmedEmail,
      passwordHash: hashPassword(password),
      subscriptionType: "Free",
      createdAt: new Date().toISOString(),
      preferences: { currency: "USD", travelStyle: "Balanced", pace: "Moderate" }
    };

    db.users.push(newUser);
    saveDB();

    const token = generateToken(newUser.id, newUser.email);
    res.status(201).json({
      token,
      access: token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, subscriptionType: newUser.subscriptionType, createdAt: newUser.createdAt, preferences: newUser.preferences }
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.users.find(u => u.email === trimmedEmail);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const token = generateToken(user.id, user.email);
    res.json({
      token,
      access: token,
      user: { id: user.id, name: user.name, email: user.email, subscriptionType: user.subscriptionType, createdAt: user.createdAt, preferences: user.preferences }
    });
  });

  app.get("/api/auth/me", authenticateUser, (req, res) => {
    const user = db.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, name: user.name, email: user.email, subscriptionType: user.subscriptionType, createdAt: user.createdAt, preferences: user.preferences });
  });

  // ─── USER ENDPOINTS ────────────────────────────────────────────────────────

  app.post("/api/users/upgrade", authenticateUser, (req, res) => {
    const { plan } = req.body;
    if (!plan || (plan !== "Pro" && plan !== "Premium")) {
      return res.status(400).json({ error: "Invalid plan. Choose Pro or Premium." });
    }

    const userIndex = db.users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    db.users[userIndex].subscriptionType = plan;
    saveDB();

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan}! Enjoy unlimited travel planning.`,
      user: { id: db.users[userIndex].id, name: db.users[userIndex].name, email: db.users[userIndex].email, subscriptionType: db.users[userIndex].subscriptionType, preferences: db.users[userIndex].preferences }
    });
  });

  app.put("/api/auth/preferences", authenticateUser, (req, res) => {
    const { name, preferred_currency, travel_style, preferred_pace, profile_image } = req.body;
    const userIndex = db.users.findIndex(u => u.id === req.user.userId);
    if (userIndex === -1) return res.status(404).json({ error: "User not found" });

    if (name) db.users[userIndex].name = name.trim();
    if (profile_image) db.users[userIndex].profileImage = profile_image;

    if (!db.users[userIndex].preferences) {
      db.users[userIndex].preferences = { currency: "USD", travelStyle: "Balanced", pace: "Moderate" };
    }

    db.users[userIndex].preferences = {
      currency: preferred_currency || db.users[userIndex].preferences.currency || "USD",
      travelStyle: travel_style || db.users[userIndex].preferences.travelStyle || "Balanced",
      pace: preferred_pace || db.users[userIndex].preferences.pace || "Moderate"
    };

    saveDB();

    const u = db.users[userIndex];
    res.json({
      success: true,
      message: "Preferences updated.",
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        subscriptionType: u.subscriptionType || "Free",
        profileImage: u.profileImage || "",
        preferredCurrency: u.preferences.currency,
        travelStyle: u.preferences.travelStyle,
        preferredPace: u.preferences.pace
      }
    });
  });

  // ─── TRIP ENDPOINTS ───────────────────────────────────────────────────────

  app.get("/api/trips", authenticateUser, (req, res) => {
    const userTrips = db.trips.filter(t => t.userId === req.user.userId);
    userTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userTrips);
  });

  app.get("/api/trips/:id", authenticateUser, (req, res) => {
    const trip = db.trips.find(t => t.id === req.params.id && t.userId === req.user.userId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(trip);
  });

  app.delete("/api/trips/:id", authenticateUser, (req, res) => {
    const tripIndex = db.trips.findIndex(t => t.id === req.params.id && t.userId === req.user.userId);
    if (tripIndex === -1) return res.status(404).json({ error: "Trip not found or does not belong to you" });

    db.trips.splice(tripIndex, 1);
    saveDB();
    res.json({ success: true, message: "Trip deleted successfully" });
  });

  app.post("/api/trips/:id/share", authenticateUser, (req, res) => {
    const tripIndex = db.trips.findIndex(t => t.id === req.params.id && t.userId === req.user.userId);
    if (tripIndex === -1) return res.status(404).json({ error: "Trip not found" });

    const shareToken = crypto.randomBytes(16).toString("hex");
    db.trips[tripIndex].shareToken = shareToken;
    saveDB();
    res.json({ success: true, share_token: shareToken, shareToken, shareUrl: `/shared/${shareToken}` });
  });

  app.get("/api/trips/shared/:token", (req, res) => {
    const trip = db.trips.find(t => t.shareToken === req.params.token);
    if (!trip) return res.status(404).json({ error: "Shared trip not found or link expired" });
    const { userId, shareToken, ...publicTrip } = trip;
    res.json(publicTrip);
  });

  // ─── AI TRIP GENERATION ───────────────────────────────────────────────────

  app.post("/api/trips/generate", authenticateUser, async (req, res) => {
    const { destination, startDate, endDate, budget, interests, travelStyle, pace, accommodation, currency } = req.body;

    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({ error: "Missing required fields: destination, startDate, endDate, budget" });
    }

    const user = db.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(403).json({ error: "Unauthorized" });

    const userTripsCount = db.trips.filter(t => t.userId === req.user.userId).length;
    if (user.subscriptionType === "Free" && userTripsCount >= 3) {
      return res.status(403).json({
        error: "Free plan limit reached (3 trips). Upgrade to Pro in Settings for unlimited itineraries!"
      });
    }

    if (!rateLimit(req.user.userId, 5, 60000)) {
      return res.status(429).json({ error: "Too many requests. Please wait a minute before generating again." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    let daysCount = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (daysCount > 10) daysCount = 7;
    if (daysCount < 1) daysCount = 1;

    try {
      const gAI = getGenAI();
      const cleanInterests = Array.isArray(interests) ? interests : [interests || "Sightseeing"];
      const interestsText = cleanInterests.join(", ") || "Sightseeing, local culture, dining";
      const stylePref = travelStyle || "Balanced";
      const pacePref = pace || "Moderate";
      const accomPref = accommodation || "Hotel";
      const budgetCurrency = currency || "USD";

      const systemInstruction = `You are a world-class AI Travel Planner. Generate highly detailed, realistic travel itineraries as valid JSON. 
      Style: ${stylePref}. Pace: ${pacePref}. Accommodation preference: ${accomPref}.
      Include real places with accurate GPS coordinates for ${destination}.
      Keep latitude and longitude strictly numeric (not strings).
      Budget is in ${budgetCurrency}.`;

      const prompt = `Create a detailed ${daysCount}-day itinerary for ${destination}.
      
Travel Details:
- Duration: ${daysCount} days (${startDate} to ${endDate})
- Total Budget: ${budgetCurrency} ${budget}
- Travel Style: ${stylePref}
- Pace: ${pacePref}
- Accommodation: ${accomPref}
- Interests: ${interestsText}
 
Requirements:
- Recommend at minimum: 1 hotel/accommodation, 2-3 restaurants, 3-5 attractions
- Use accurate GPS coordinates for all places in ${destination}
- Include transport info between activities
- Estimate costs realistically in ${budgetCurrency}
- Group activities logically by proximity to minimize travel time
- Include morning, afternoon, and evening activities for each day
- Add packing recommendations based on typical weather`;

      console.log(`[Gemini] Generating ${daysCount}-day itinerary for ${destination} (${stylePref}, ${pacePref} pace)...`);

      const response = await gAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dailyItinerary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    theme: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          timeOfDay: { type: Type.STRING },
                          activityName: { type: Type.STRING },
                          description: { type: Type.STRING },
                          estimatedCost: { type: Type.STRING },
                          transportInfo: { type: Type.STRING },
                          duration: { type: Type.STRING }
                        },
                        required: ["timeOfDay", "activityName", "description", "estimatedCost"]
                      }
                    }
                  },
                  required: ["dayNumber", "theme", "activities"]
                }
              },
              places: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    latitude: { type: Type.NUMBER },
                    longitude: { type: Type.NUMBER },
                    description: { type: Type.STRING },
                    rating: { type: Type.NUMBER },
                    priceRange: { type: Type.STRING }
                  },
                  required: ["name", "category", "latitude", "longitude", "description"]
                }
              },
              budgetEstimate: {
                type: Type.OBJECT,
                properties: {
                  accommodation: { type: Type.INTEGER },
                  dining: { type: Type.INTEGER },
                  transport: { type: Type.INTEGER },
                  activities: { type: Type.INTEGER },
                  contingency: { type: Type.INTEGER },
                  totalEstimate: { type: Type.INTEGER },
                  savingTips: { type: Type.STRING },
                  currency: { type: Type.STRING }
                },
                required: ["accommodation", "dining", "transport", "activities", "contingency", "totalEstimate", "savingTips"]
              },
              weatherForecast: {
                type: Type.OBJECT,
                properties: {
                  averageTemp: { type: Type.STRING },
                  condition: { type: Type.STRING },
                  recommendations: { type: Type.STRING },
                  bestMonths: { type: Type.STRING }
                },
                required: ["averageTemp", "condition", "recommendations"]
              }
            },
            required: ["dailyItinerary", "places", "budgetEstimate", "weatherForecast"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty AI response");

      const parsedAI = JSON.parse(responseText.trim());

      const newTrip = {
        id: "t_" + crypto.randomUUID(),
        userId: req.user.userId,
        destination: destination.trim(),
        startDate,
        endDate,
        budget: Number(budget),
        interests: cleanInterests,
        travelStyle: stylePref,
        pace: pacePref,
        accommodation: accomPref,
        currency: budgetCurrency,
        createdAt: new Date().toISOString(),
        dailyItinerary: parsedAI.dailyItinerary,
        places: parsedAI.places,
        budgetEstimate: { ...parsedAI.budgetEstimate, currency: budgetCurrency },
        weatherForecast: parsedAI.weatherForecast
      };

      db.trips.push(newTrip);
      saveDB();

      res.status(201).json(newTrip);
    } catch (error) {
      console.error("AI Generation Failed:", error);
      res.status(500).json({
        error: "Failed to generate travel plan. Please try again.",
        details: error?.message || String(error)
      });
    }
  });

  // ─── AI CHAT ABOUT A TRIP ─────────────────────────────────────────────────

  app.post("/api/ai/chat/:id", authenticateUser, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const trip = db.trips.find(t => t.id === req.params.id && t.userId === req.user.userId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    if (!rateLimit(req.user.userId, 20, 60000)) {
      return res.status(429).json({ error: "Too many chat messages. Please wait a moment." });
    }

    try {
      const gAI = getGenAI();
      const tripContext = `
Trip: ${trip.destination}
Duration: ${trip.dailyItinerary.length} days (${trip.startDate} to ${trip.endDate})
Budget: ${trip.currency || "USD"} ${trip.budget}
Interests: ${trip.interests.join(", ")}
Travel Style: ${trip.travelStyle || "Balanced"}
Key Places: ${trip.places.slice(0, 5).map(p => p.name).join(", ")}
Total Estimated Cost: ${trip.currency || "USD"} ${trip.budgetEstimate.totalEstimate}
Weather: ${trip.weatherForecast.averageTemp}, ${trip.weatherForecast.condition}
      `.trim();

      const systemInstruction = `You are a helpful travel assistant for Vagabond AI Travel Planner. 
You have detailed knowledge about this specific trip:
${tripContext}

Answer questions concisely and helpfully. Be friendly and conversational. 
If asked about packing, currency, local tips, restaurants, or transport — give specific advice for ${trip.destination}.
Keep answers under 150 words.`;

      const response = await gAI.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: message,
        config: { systemInstruction }
      });

      res.json({ reply: response.text || "I'm not sure about that. Try rephrasing your question!" });
    } catch (error) {
      console.error("Chat AI error:", error);
      res.status(500).json({ error: "Chat unavailable. Please try again.", reply: "I'm having trouble connecting right now. Please try again in a moment!" });
    }
  });

  // ─── EXPLORE / DESTINATIONS ───────────────────────────────────────────────

  app.get("/api/destinations/popular", (req, res) => {
    res.json(POPULAR_DESTINATIONS);
  });

  // ─── STATS ────────────────────────────────────────────────────────────────

  app.get("/api/stats", authenticateUser, (req, res) => {
    const userTrips = db.trips.filter(t => t.userId === req.user.userId);
    const totalBudget = userTrips.reduce((sum, t) => sum + (t.budget || 0), 0);
    const totalEstimated = userTrips.reduce((sum, t) => sum + (t.budgetEstimate?.totalEstimate || 0), 0);
    const destinations = [...new Set(userTrips.map(t => t.destination.split(",")[0]))];
    const totalDays = userTrips.reduce((sum, t) => sum + (t.dailyItinerary?.length || 0), 0);

    res.json({
      totalTrips: userTrips.length,
      total_trips: userTrips.length,
      uniqueDestinations: destinations.length,
      unique_destinations: destinations.length,
      totalBudgetPlanned: totalBudget,
      total_budget_planned: totalBudget,
      totalEstimatedSpend: totalEstimated,
      total_estimated_spend: totalEstimated,
      totalDaysPlanned: totalDays,
      total_days_planned: totalDays,
      topDestinations: destinations.slice(0, 5),
      top_destinations: destinations.slice(0, 5)
    });
  });

  // ─── STATIC / VITE ────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🌍 Vagabond AI Travel Planner running on http://0.0.0.0:${PORT}`);
    console.log(`📦 Database: ${DB_FILE}`);
    console.log(`🤖 Gemini Model: gemini-2.0-flash-lite\n`);
  });
}

startServer();
