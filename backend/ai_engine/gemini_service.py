"""
AI Travel Service — Core AI engine for travel itinerary generation.

Uses google-genai (new SDK). Falls back to rich demo data if quota is exhausted.
"""

import json
import logging
import math
import random
from datetime import date, timedelta
from typing import Optional
from django.conf import settings

logger = logging.getLogger('ai_engine')


# ─── Prompt Builder ───────────────────────────────────────────────────────────

def build_itinerary_prompt(
    destination: str,
    starting_location: str,
    start_date: str,
    end_date: str,
    budget: float,
    currency: str,
    interests: list,
    travel_style: str,
    pace: str,
    accommodation: str,
    days_count: int,
) -> str:
    interests_text = ", ".join(interests) if interests else "sightseeing, local culture, food"
    has_origin = starting_location and starting_location.strip() not in ("", "Not specified")
    origin_line = f"- Starting Location (Origin): {starting_location}" if has_origin else ""
    origin_ref = starting_location if has_origin else "traveler's home city"
    last_day = days_count

    acts_guide = (
        "2-3 activities" if pace in ("Very Slow", "Relaxed")
        else "3-4 activities" if pace == "Moderate"
        else "5-6 activities"
    )

    return f"""You are a world-class travel planner. Generate a COMPLETE round-trip travel itinerary.

TRIP DETAILS:
{origin_line}
- Destination: {destination}
- Trip Duration: {days_count} days ({start_date} to {end_date})
- Total Budget: {currency} {budget}
- Travel Style: {travel_style}
- Pace: {pace} ({acts_guide})
- Accommodation: {accommodation}
- Interests: {interests_text}

STRICT ROUND-TRIP REQUIREMENTS — FOLLOW EXACTLY:

DAY 1 — ARRIVAL DAY (is_travel_day: true):
  Theme: "Departure from {origin_ref} and Arrival in {destination}"
  Morning: Depart {origin_ref} by realistic flight/train/bus. Include price, duration, airline/route.
  Afternoon: Arrive {destination}. Airport or station transfer to hotel. Hotel check-in.
  Evening: Light dinner near hotel, first walk in the neighborhood, early rest for jet lag.

DAYS 2 to {max(last_day - 1, 2)} — FULL EXPLORATION DAYS (is_travel_day: false):
  Full days discovering {destination}.
  Morning, Afternoon, Evening activities.
  Authentic local food, transport between places.
  Group nearby attractions to save travel time.

DAY {last_day} — RETURN DEPARTURE DAY (is_travel_day: true):
  Theme: "Farewell {destination} and Return to {origin_ref}"
  Morning: Early breakfast, hotel checkout, last souvenir shopping.
  Midday: Transfer to airport or station.
  Afternoon/Evening: Flight/train back to {origin_ref}.

EVERY ACTIVITY must include:
  booking_tip: How to book tickets, skip queues, or get best prices.
  local_tip: Insider advice, what locals do, what to avoid.
  Realistic cost in {currency}.
  Specific transport info (mode, duration, approximate cost).

The budget of {currency} {budget} MUST cover round-trip transport from {origin_ref} to {destination} and back.

IMPORTANT: Return ONLY valid JSON. No markdown fences. No extra text. Only the JSON object.

Return this exact JSON structure:
{{
  "daily_itinerary": [
    {{
      "day_number": 1,
      "theme": "Departure from {origin_ref} and Arrival in {destination}",
      "is_travel_day": true,
      "estimated_daily_cost": 250,
      "transport_summary": "Flight {origin_ref} to {destination}: approx {currency} 200, 3 hours",
      "activities": [
        {{
          "time_of_day": "Morning",
          "activity_name": "Depart from {origin_ref}",
          "description": "Head to the airport early morning. Your flight departs at 09:00 AM and arrives at 12:00 PM local time in {destination}. Check in online the night before to save time.",
          "estimated_cost": "{currency} 200",
          "transport_info": "Metro or taxi to airport (45 min, {currency} 10-15) | Flight: 3 hours direct",
          "booking_tip": "Book flights 6-8 weeks in advance for best prices. Set a price alert on Google Flights or Skyscanner.",
          "local_tip": "Arrive at the airport 2.5 hours early for international flights. Keep all documents in one place.",
          "duration": "4 hours including check-in and flight",
          "order": 1
        }},
        {{
          "time_of_day": "Afternoon",
          "activity_name": "Arrival and Hotel Check-in in {destination}",
          "description": "Land at {destination} airport. Clear immigration and customs. Take a pre-booked transfer or airport bus to your hotel. Check in, freshen up.",
          "estimated_cost": "{currency} 30",
          "transport_info": "Airport express train or taxi to city center (30-45 min, {currency} 15-30)",
          "booking_tip": "Pre-book your airport transfer online for a fixed rate. Avoid unlicensed taxis at the arrival hall.",
          "local_tip": "Exchange a small amount of local cash at the airport for immediate needs. Rates are better in the city.",
          "duration": "2 hours",
          "order": 2
        }},
        {{
          "time_of_day": "Evening",
          "activity_name": "First Night Dinner and Neighborhood Walk",
          "description": "After settling in, take a gentle walk around your hotel neighborhood. Grab a light dinner at a nearby local restaurant to ease into the new timezone.",
          "estimated_cost": "{currency} 20",
          "transport_info": "5-minute walk from hotel",
          "booking_tip": "No booking needed for casual dinner spots. Ask your hotel reception for their top local restaurant pick.",
          "local_tip": "Keep it light tonight and sleep early to beat jet lag. Tomorrow the real adventure starts!",
          "duration": "2 hours",
          "order": 3
        }}
      ]
    }}
  ],
  "places": [
    {{
      "name": "Recommended Hotel Name",
      "category": "hotel",
      "latitude": 41.9028,
      "longitude": 12.4964,
      "description": "Well-located 4-star hotel in the city center with easy access to main sights.",
      "price_range": "{currency} 80-150 per night",
      "rating": 4.5,
      "order": 1
    }}
  ],
  "budget_breakdown": {{
    "accommodation": 400,
    "dining": 300,
    "transport": 400,
    "activities": 200,
    "contingency": 100,
    "total_estimate": 1400,
    "currency": "{currency}",
    "saving_tips": "Specific, actionable money-saving advice for this exact trip."
  }},
  "weather_forecast": {{
    "average_temp": "22 C / 72 F",
    "condition": "Partly Cloudy",
    "recommendations": "Pack light layers, comfortable walking shoes, and a compact umbrella.",
    "best_months": "March to May, October to November"
  }}
}}"""


def build_chat_prompt(trip_context: dict, user_message: str) -> str:
    """Build context-aware chat prompt for trip Q&A."""
    return f"""You are a helpful AI travel assistant for Vagabond Travel Planner.
You have detailed knowledge about this specific trip:

Trip: {trip_context.get('destination')}
Duration: {trip_context.get('days_count')} days ({trip_context.get('start_date')} to {trip_context.get('end_date')})
Budget: {trip_context.get('currency')} {trip_context.get('budget')}
Travel Style: {trip_context.get('travel_style', 'Balanced')}
Interests: {', '.join(trip_context.get('interests', []))}
Key Places: {', '.join(trip_context.get('top_places', [])[:5])}
Estimated Cost: {trip_context.get('currency')} {trip_context.get('total_estimated', 0)}
Weather: {trip_context.get('weather_temp', 'N/A')}, {trip_context.get('weather_condition', 'N/A')}

User Question: {user_message}

Guidelines:
- Be friendly and concise (under 150 words)
- Give specific advice for {trip_context.get('destination')}
- If asked about packing, currency, local tips, safety, food, or transport — provide specific details
- Use emojis sparingly for friendliness
- If unsure, say so honestly and suggest checking local resources

Answer:"""


# ─── Demo / Fallback Data Generator ──────────────────────────────────────────

# Known city coordinates for realistic map pins
CITY_COORDS = {
    "paris": (48.8566, 2.3522), "rome": (41.9028, 12.4964),
    "tokyo": (35.6762, 139.6503), "new york": (40.7128, -74.0060),
    "london": (51.5074, -0.1278), "barcelona": (41.3851, 2.1734),
    "bali": (-8.3405, 115.0920), "dubai": (25.2048, 55.2708),
    "singapore": (1.3521, 103.8198), "istanbul": (41.0082, 28.9784),
    "amsterdam": (52.3676, 4.9041), "prague": (50.0755, 14.4378),
    "sydney": (-33.8688, 151.2093), "bangkok": (13.7563, 100.5018),
    "mumbai": (19.0760, 72.8777), "delhi": (28.6139, 77.2090),
    "florence": (43.7696, 11.2558), "athens": (37.9838, 23.7275),
    "kyoto": (35.0116, 135.7681), "lisbon": (38.7223, -9.1393),
    "italy": (41.9028, 12.4964), "japan": (35.6762, 139.6503),
    "france": (48.8566, 2.3522), "india": (28.6139, 77.2090),
    "goa": (15.2993, 74.1240), "kerala": (10.8505, 76.2711),
    "thailand": (13.7563, 100.5018), "vietnam": (21.0285, 105.8542),
    "nepal": (27.7172, 85.3240), "sri lanka": (7.8731, 80.7718),
}

TIME_OF_DAY_CYCLE = ["Morning", "Afternoon", "Evening"]

ACTIVITY_TEMPLATES = {
    "Morning": [
        ("Breakfast at a Local Café", "Start your day with fresh local breakfast and coffee. The morning is the best time to watch the city wake up.", "1 hour",
         "Arrive before 8 AM to avoid queues. Ask for the 'local menu' — it's usually cheaper.", "Locals eat breakfast late (9-10 AM). Go earlier for a quieter experience."),
        ("Old Town Heritage Walk", "Wander through historic streets and admire centuries-old architecture. Pick up a free map from your hotel.", "2 hours",
         "Join a free walking tour for richer context. Tips are appreciated.", "Wear comfortable shoes. The golden hour (7-8 AM) offers the best light for photos."),
        ("Central Market Exploration", "Browse fresh produce, spices, and local handicrafts at the iconic central market.", "1.5 hours",
         "Bargain politely — start at 50% of asking price for crafts. Fixed prices for food.", "Shop before 10 AM when produce is freshest and crowds are smaller."),
        ("Sunrise Viewpoint Visit", "Catch the sunrise from the city's best viewpoint — a truly magical experience.", "1.5 hours",
         "Check sunrise time the day before. Some viewpoints require pre-booking.", "Bring a light jacket — hilltop spots can be chilly in the morning."),
        ("Morning Temple or Church Visit", "Explore a beautiful temple, mosque, or church before the tourist crowds arrive.", "2 hours",
         "Check dress code requirements before visiting. Cover shoulders and knees.", "Visit on weekdays for a more peaceful experience. Mondays are typically quietest."),
    ],
    "Afternoon": [
        ("Local Restaurant Lunch", "Enjoy a traditional lunch at a well-reviewed local restaurant. Try the chef's special of the day.", "1.5 hours",
         "Restaurants fill up 12:30-1:30 PM. Book ahead or arrive early.", "Order what locals are eating — point to nearby tables if you can't read the menu."),
        ("Main Museum Visit", "Explore the city's premier museum showcasing history, art, and culture.", "2.5 hours",
         "Buy tickets online to skip the entry queue. Many museums are free on the first Sunday of the month.", "Audio guides are worth the extra cost. Allow at least 2.5 hours."),
        ("Scenic Neighbourhood Stroll", "Explore a vibrant local neighbourhood away from the typical tourist path.", "2 hours",
         "Ask hotel staff which neighbourhood they personally love — not just the tourist ones.", "Look for street art, independent cafes, and local grocery stores for authentic experiences."),
        ("Boat Tour or River Cruise", "See the city from a different perspective on a scenic river or harbor cruise.", "2 hours",
         "Book morning or sunset tours for better light and cooler temperatures.", "Sit on the left/right side (check online) for the best views of key landmarks."),
        ("Art Gallery or Cultural Centre", "Discover local contemporary art and understand the city's creative soul.", "1.5 hours",
         "Many galleries are free. Check for special exhibitions happening during your visit.", "Visiting on weekday afternoons means you often have the gallery nearly to yourself."),
    ],
    "Evening": [
        ("Sunset Panorama Viewpoint", "Head to the city's iconic viewpoint to watch the sun dip below the horizon.", "1 hour",
         "Arrive 30 minutes before sunset to get a good spot. Bring a camera.", "Some free viewpoints are better than paid observation decks — research before you go."),
        ("Traditional Dinner Experience", "Sit down for an authentic multi-course dinner at a restaurant beloved by locals for generations.", "2.5 hours",
         "Reserve a table 1-2 days in advance for popular restaurants. Ask for outdoor seating.", "Share dishes family-style to try more flavors. Don't rush — dinner is an event here."),
        ("Night Market and Street Food", "Experience the buzzing night market — a sensory feast of food stalls, crafts, and live music.", "2 hours",
         "Bring cash in small bills. Most stalls don't accept cards.", "Eat where the locals eat. Long queues usually mean the food is worth it."),
        ("Live Music or Cultural Show", "Attend a traditional music, dance, or cultural performance unique to this destination.", "2 hours",
         "Book tickets 1-2 days ahead. Check local event listings or ask your hotel concierge.", "Sit in the middle rows for the best view and sound experience."),
        ("Rooftop Bar or Sunset Cafe", "End the day with drinks and city lights at a rooftop venue.", "1.5 hours",
         "Smart casual dress code at most rooftop bars. Some require reservations.", "Order locally crafted cocktails or regional wines for the full experience."),
    ],
}

DAY_THEMES = [
    "Arrival & First Impressions",
    "Historic Heart of the City",
    "Culture, Cuisine & Local Life",
    "Nature, Parks & Hidden Gems",
    "Art, Architecture & Markets",
    "Local Neighbourhoods & Food Trails",
    "Adventure, Outdoors & Discovery",
    "Relaxation, Wellness & Slow Travel",
    "Final Memories & Farewell Dinner",
    "Hotel Checkout & Return Journey",
]


def _get_city_coords(destination: str):
    """Return best-guess lat/lng for a destination string."""
    dest_lower = destination.lower()
    for key, coords in CITY_COORDS.items():
        if key in dest_lower:
            return coords
    # Generic fallback — Europe center-ish
    return (48.0, 16.0)


def _jitter(base: float, scale: float = 0.02) -> float:
    """Add small random offset to coordinates for map variety."""
    return round(base + random.uniform(-scale, scale), 6)


def build_demo_itinerary(
    destination: str,
    budget: float,
    currency: str,
    days_count: int,
    travel_style: str,
    pace: str,
    starting_location: str = "",
) -> dict:
    """Generate a rich, realistic-looking demo itinerary when AI is unavailable."""
    base_lat, base_lng = _get_city_coords(destination)
    city_short = destination.split(",")[0].strip()
    origin = starting_location.strip() if starting_location and starting_location not in ("", "Not specified") else "your home city"

    acts_per_day = 2 if pace in ("Very Slow", "Relaxed") else 3 if pace == "Moderate" else 4

    daily = []
    for day_num in range(1, days_count + 1):
        is_travel_day = (day_num == 1 or day_num == days_count)
        daily_cost = round(budget / days_count * random.uniform(0.8, 1.2))

        if day_num == 1:
            # Arrival Day
            theme = f"Departure from {origin} & Arrival in {city_short}"
            transport_summary = f"Flight/train from {origin} to {city_short} (~{currency} {round(budget * 0.15)}, 3-5 hrs)"
            activities = [
                {
                    "time_of_day": "Morning",
                    "activity_name": f"Depart from {origin}",
                    "description": f"Head to the airport or station early. Your journey to {city_short} begins! Check in online the night before to save time at the airport.",
                    "estimated_cost": f"{currency} {round(budget * 0.15)}",
                    "transport_info": f"Taxi/metro to departure point (30-45 min) | Travel time to {city_short}: ~3-5 hours",
                    "booking_tip": "Book tickets 4-6 weeks in advance for best prices. Use price comparison sites like Google Flights or Skyscanner.",
                    "local_tip": f"Pack a neck pillow and noise-cancelling earphones for comfort. Download offline maps for {city_short} before departure.",
                    "duration": "4-5 hours",
                    "order": 1,
                },
                {
                    "time_of_day": "Afternoon",
                    "activity_name": f"Arrive in {city_short} & Hotel Check-in",
                    "description": f"Welcome to {city_short}! Clear arrival formalities and take a transfer to your hotel. Check in, freshen up, and begin soaking in the new environment.",
                    "estimated_cost": f"{currency} {round(budget * 0.03)}",
                    "transport_info": f"Airport express train or pre-booked taxi to city centre (25-40 min, {currency} 15-30)",
                    "booking_tip": "Pre-book your airport transfer online for a guaranteed fixed rate. Avoid unlicensed taxis.",
                    "local_tip": f"Exchange a small amount of local cash at the airport. Ask your hotel about a SIM card or local data plan.",
                    "duration": "2 hours",
                    "order": 2,
                },
                {
                    "time_of_day": "Evening",
                    "activity_name": "First Night Dinner & Neighbourhood Stroll",
                    "description": f"Take a gentle walk around your hotel area to get your bearings in {city_short}. Find a cosy local restaurant nearby for a light first dinner.",
                    "estimated_cost": f"{currency} {round(daily_cost * 0.15)}",
                    "transport_info": "5-10 minute walk from hotel",
                    "booking_tip": "Ask your hotel reception for their top local restaurant recommendations — they always know the best spots.",
                    "local_tip": "Keep tonight light and low-key. Sleep early to beat any jet lag so you're fresh for Day 2!",
                    "duration": "2 hours",
                    "order": 3,
                },
            ]
        elif day_num == days_count and days_count > 1:
            # Departure Day
            theme = f"Farewell {city_short} & Return to {origin}"
            transport_summary = f"Return flight/train from {city_short} to {origin} (~{currency} {round(budget * 0.15)}, 3-5 hrs)"
            activities = [
                {
                    "time_of_day": "Morning",
                    "activity_name": "Final Breakfast & Hotel Checkout",
                    "description": f"Enjoy one last breakfast in {city_short}. Pack your bags and check out of your hotel. Use the hotel's luggage storage if your flight is in the afternoon.",
                    "estimated_cost": f"{currency} {round(daily_cost * 0.08)}",
                    "transport_info": "Walk to nearby breakfast spot, return to hotel",
                    "booking_tip": "Most hotels offer free luggage storage until your departure — always ask at check-out.",
                    "local_tip": f"Buy local treats, sweets, or specialty foods as souvenirs — far more memorable than generic gifts.",
                    "duration": "1.5 hours",
                    "order": 1,
                },
                {
                    "time_of_day": "Morning",
                    "activity_name": "Last-Minute Souvenir Shopping",
                    "description": f"Spend your last hour in {city_short} picking up final souvenirs near your hotel or at the airport duty-free.",
                    "estimated_cost": f"{currency} {round(daily_cost * 0.1)}",
                    "transport_info": "Walk to nearby market or shops",
                    "booking_tip": "Airport duty-free prices for local products can sometimes beat city prices — compare before buying.",
                    "local_tip": "Don't forget to claim VAT refunds at the airport if you spent over the threshold on eligible goods.",
                    "duration": "1 hour",
                    "order": 2,
                },
                {
                    "time_of_day": "Afternoon",
                    "activity_name": f"Airport Transfer & Departure to {origin}",
                    "description": f"Transfer to the airport in good time. Check in, clear security, and board your return flight to {origin}. Arrive home with incredible memories!",
                    "estimated_cost": f"{currency} {round(budget * 0.15)}",
                    "transport_info": f"Taxi or airport bus from city centre to airport (30-45 min, {currency} 15-30)",
                    "booking_tip": "Arrive at the airport at least 2.5 hours before an international flight. Check baggage limits to avoid fees.",
                    "local_tip": f"Save some local currency for airport snacks or last-minute purchases. Remaining cash makes great trip memorabilia!",
                    "duration": "4-5 hours including travel",
                    "order": 3,
                },
            ]
        else:
            # Regular exploration day
            theme = DAY_THEMES[min(day_num - 1, len(DAY_THEMES) - 1)]
            transport_summary = "Mix of walking, metro, and short taxi rides"
            activities = []
            order = 1
            for i in range(acts_per_day):
                tod = TIME_OF_DAY_CYCLE[i % 3]
                template = random.choice(ACTIVITY_TEMPLATES[tod])
                act_name, act_desc, act_dur, book_tip, local_tip = template
                activities.append({
                    "time_of_day": tod,
                    "activity_name": f"{act_name}",
                    "description": f"{act_desc} ({city_short})",
                    "estimated_cost": f"{currency} {round(daily_cost / acts_per_day * 0.4)}",
                    "transport_info": random.choice([
                        f"10-minute walk from previous stop",
                        f"Metro Line 2 (8 min, {currency} 2)",
                        f"Taxi (~12 min, {currency} 5-8)",
                        f"Local bus no. 14 (15 min, {currency} 1.5)",
                        f"Tuk-tuk (~10 min, {currency} 3)",
                        f"Rental bike (20 min, {currency} 5/day)",
                    ]),
                    "booking_tip": book_tip,
                    "local_tip": local_tip,
                    "duration": act_dur,
                    "order": order,
                })
                order += 1

        daily.append({
            "day_number": day_num,
            "theme": theme,
            "is_travel_day": is_travel_day,
            "estimated_daily_cost": daily_cost,
            "transport_summary": transport_summary,
            "activities": activities,
        })

    # Places
    categories = ["hotel", "restaurant", "attraction", "attraction", "restaurant", "hotel", "attraction"]
    place_names = [
        f"Grand {city_short} Hotel", f"{city_short} Central Restaurant",
        f"Historic {city_short} Museum", f"{city_short} Old Town Square",
        f"Café de {city_short}", f"{city_short} Boutique Stay",
        f"{city_short} Panorama Viewpoint",
    ]
    places = []
    for i, (name, cat) in enumerate(zip(place_names, categories)):
        places.append({
            "name": name,
            "category": cat,
            "latitude": _jitter(base_lat, 0.03),
            "longitude": _jitter(base_lng, 0.03),
            "description": f"A beloved {cat} in {city_short}, highly rated by travelers for its authentic experience.",
            "price_range": f"{currency} {random.randint(15, 80)}-{random.randint(80, 200)}",
            "rating": round(random.uniform(3.8, 4.9), 1),
            "order": i + 1,
        })

    # Budget breakdown — include round-trip transport
    transport_cost = round(budget * 0.20)  # 20% for round-trip transport
    acc = round(budget * 0.30)
    din = round(budget * 0.22)
    act = round(budget * 0.15)
    cng = round(budget * 0.08)
    total = transport_cost + acc + din + act + cng

    return {
        "daily_itinerary": daily,
        "places": places,
        "budget_breakdown": {
            "accommodation": acc,
            "dining": din,
            "transport": transport_cost,
            "activities": act,
            "contingency": cng,
            "total_estimate": total,
            "currency": currency,
            "saving_tips": (
                f"Book round-trip flights to {city_short} at least 6 weeks ahead to save 30-40%. "
                f"Use local public transport (metro/bus) instead of taxis for daily sightseeing. "
                f"Eat a main meal at lunch (usually cheaper menus) and snack at local markets in the evening. "
                f"Book accommodations with free breakfast included — it adds real value."
            ),
        },
        "weather_forecast": {
            "average_temp": "22°C / 72°F",
            "condition": "Mostly Sunny",
            "recommendations": (
                "Pack light breathable layers, a compact umbrella, and very comfortable walking shoes. "
                "A portable power bank is essential for all-day navigation. "
                "Sunscreen and a refillable water bottle will save you money daily."
            ),
            "best_months": "April to June, September to November",
        },
        "_demo_mode": True,
    }


# ─── Main Generation Function ─────────────────────────────────────────────────

def generate_itinerary(
    destination: str,
    starting_location: str = '',
    start_date: str = '',
    end_date: str = '',
    budget: float = 1500,
    currency: str = 'USD',
    interests: Optional[list] = None,
    travel_style: str = 'Balanced',
    pace: str = 'Moderate',
    accommodation: str = 'Hotel',
    days_count: int = 5,
) -> dict:
    """
    Core function: Generate a full travel itinerary using AI.
    Falls back to demo data if AI quota is exhausted.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("[AI] No API key configured — using demo mode")
        return build_demo_itinerary(destination, budget, currency, days_count, travel_style, pace, starting_location)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.0-flash')
        if model_name == 'gemini-2.0-flash-lite':
            model_name = 'gemini-2.0-flash'

        prompt = build_itinerary_prompt(
            destination=destination,
            starting_location=starting_location,
            start_date=start_date,
            end_date=end_date,
            budget=budget,
            currency=currency,
            interests=interests or ['Sightseeing', 'Local Culture'],
            travel_style=travel_style,
            pace=pace,
            accommodation=accommodation,
            days_count=days_count,
        )

        logger.info(f"[AI] Generating {days_count}-day round-trip itinerary from {starting_location} to {destination}")

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
                top_p=0.9,
                system_instruction=(
                    f"You are a world-class travel planner AI. Generate highly detailed, realistic, "
                    f"and practical round-trip travel itineraries. Always include Day 1 as arrival from "
                    f"the starting location and the last day as return journey. "
                    f"Use accurate GPS coordinates for {destination}. "
                    f"Tailor for a {travel_style} traveler with {pace} pace. "
                    f"Accommodation: {accommodation}. All costs in {currency}."
                ),
            ),
        )

        raw = (response.text or "").strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:])  # drop first ```json line
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as je:
            logger.warning(f"[AI] JSON parse failed ({je}) — falling back to demo mode")
            return build_demo_itinerary(destination, budget, currency, days_count, travel_style, pace, starting_location)

        logger.info(f"[AI] Successfully generated itinerary with {len(data.get('daily_itinerary', []))} days")
        return data

    except Exception as e:
        err_str = str(e)
        # Quota exhausted or import error — fall back to demo data
        if any(x in err_str for x in ["429", "RESOURCE_EXHAUSTED", "quota", "ModuleNotFoundError", "ImportError", "cannot import"]):
            logger.warning(f"[AI] Falling back to demo mode. Reason: {err_str[:150]}")
            return build_demo_itinerary(destination, budget, currency, days_count, travel_style, pace, starting_location)
        # Other errors — re-raise so the view returns a 500 with details
        logger.error(f"[AI] Generation failed: {type(e).__name__}: {e}")
        raise


def chat_with_ai(trip_context: dict, user_message: str) -> str:
    """Chat with AI about a specific trip."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return "AI assistant requires an API key to be configured. Please add GEMINI_API_KEY to your .env file."

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        model_name = getattr(settings, 'GEMINI_MODEL', 'gemini-2.0-flash')
        if model_name == 'gemini-2.0-flash-lite':
            model_name = 'gemini-2.0-flash'

        prompt = build_chat_prompt(trip_context, user_message)

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.8,
                top_p=0.9,
                max_output_tokens=300,
            ),
        )
        return response.text or "I'm having trouble connecting right now. Please try again!"

    except Exception as e:
        logger.error(f"[AI] Chat failed: {e}")
        return "Sorry, the AI assistant is temporarily unavailable. Please try again later! 🙏"
