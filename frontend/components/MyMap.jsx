import { useEffect, useRef } from "react";

// City coordinate lookup for drawing the macro route (origin ↔ destination)
const CITY_COORDS_MAP = {
  "paris": [48.8566, 2.3522], "rome": [41.9028, 12.4964],
  "tokyo": [35.6762, 139.6503], "new york": [40.7128, -74.0060],
  "london": [51.5074, -0.1278], "barcelona": [41.3851, 2.1734],
  "bali": [-8.3405, 115.0920], "dubai": [25.2048, 55.2708],
  "singapore": [1.3521, 103.8198], "istanbul": [41.0082, 28.9784],
  "amsterdam": [52.3676, 4.9041], "prague": [50.0755, 14.4378],
  "sydney": [-33.8688, 151.2093], "bangkok": [13.7563, 100.5018],
  "mumbai": [19.0760, 72.8777], "delhi": [28.6139, 77.2090],
  "florence": [43.7696, 11.2558], "athens": [37.9838, 23.7275],
  "kyoto": [35.0116, 135.7681], "lisbon": [38.7223, -9.1393],
  "italy": [41.9028, 12.4964], "japan": [35.6762, 139.6503],
  "france": [48.8566, 2.3522], "india": [28.6139, 77.2090],
  "goa": [15.2993, 74.1240], "kerala": [10.8505, 76.2711],
  "thailand": [13.7563, 100.5018], "vietnam": [21.0285, 105.8542],
  "nepal": [27.7172, 85.3240], "sri lanka": [7.8731, 80.7718],
  "new york city": [40.7128, -74.0060], "nyc": [40.7128, -74.0060],
  "los angeles": [34.0522, -118.2437], "chicago": [41.8781, -87.6298],
  "toronto": [43.6532, -79.3832], "vancouver": [49.2827, -123.1207],
  "berlin": [52.5200, 13.4050], "vienna": [48.2082, 16.3738],
  "madrid": [40.4168, -3.7038], "milan": [45.4642, 9.1900],
  "moscow": [55.7558, 37.6176], "beijing": [39.9042, 116.4074],
  "shanghai": [31.2304, 121.4737], "seoul": [37.5665, 126.9780],
  "hong kong": [22.3193, 114.1694], "taipei": [25.0330, 121.5654],
  "cairo": [30.0444, 31.2357], "cape town": [-33.9249, 18.4241],
  "nairobi": [-1.2921, 36.8219], "mexico city": [19.4326, -99.1332],
  "rio de janeiro": [-22.9068, -43.1729], "buenos aires": [-34.6037, -58.3816],
  "greater london": [51.5074, -0.1278], "kolkata": [22.5726, 88.3639],
  "chennai": [13.0827, 80.2707], "hyderabad": [17.3850, 78.4867],
  "bangalore": [12.9716, 77.5946], "bengaluru": [12.9716, 77.5946],
  "ahmedabad": [23.0225, 72.5714], "pune": [18.5204, 73.8567],
};

function getCityCoords(cityName) {
  if (!cityName) return null;
  const lower = cityName.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDS_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  return null;
}

// Create a great-circle arc between two lat/lng points (for curved route line)
function greatCircleArc(from, to, steps = 80) {
  const toRad = d => (d * Math.PI) / 180;
  const toDeg = r => (r * 180) / Math.PI;
  const [lat1, lng1] = from.map(toRad);
  const [lat2, lng2] = to.map(toRad);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * Math.PI) / Math.sin(Math.PI);
    const B = Math.sin(f * Math.PI) / Math.sin(Math.PI);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));
    points.push([lat, lng]);
  }
  return points;
}

export default function MyMap({ places, destination, originCity = "", interactive = true, height = "500px" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    const validPlaces = (places || []).filter(
      p => typeof p.latitude === "number" && typeof p.longitude === "number"
    );

    // Resolve origin & destination coordinates
    const originCoords = getCityCoords(originCity);
    const destCoords = getCityCoords(destination);

    // Map center: prefer destination places center, fall back to dest coords
    let centerLat = destCoords?.[0] ?? 20;
    let centerLng = destCoords?.[1] ?? 0;
    if (validPlaces.length > 0) {
      centerLat = validPlaces.reduce((s, p) => s + p.latitude, 0) / validPlaces.length;
      centerLng = validPlaces.reduce((s, p) => s + p.longitude, 0) / validPlaces.length;
    }

    // Determine initial zoom — if we have an origin far away, zoom out to show the arc
    const hasRoute = originCoords && destCoords;
    const initZoom = validPlaces.length > 0 ? (hasRoute ? 5 : 13) : 3;

    // Destroy previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: initZoom,
      zoomControl: true,
      scrollWheelZoom: interactive,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });
    mapInstanceRef.current = map;

    // CartoDB Voyager tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Clear old markers & polylines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylinesRef.current.forEach(p => p.remove());
    polylinesRef.current = [];

    const allBounds = [];

    // ── 1. ORIGIN marker ────────────────────────────────────────────────────
    if (originCoords) {
      const originIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:44px;height:44px;border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border:3px solid white;
          box-shadow:0 4px 16px rgba(99,102,241,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:20px;
        ">🏠</div>
        <div style="
          position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
          background:#6366f1;color:white;font-size:9px;font-weight:800;
          padding:2px 6px;border-radius:20px;white-space:nowrap;
          font-family:Inter,sans-serif;letter-spacing:0.05em;
        ">YOUR HOME</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -26],
      });
      const originName = originCity || "Your Home City";
      const originMarker = L.marker(originCoords, { icon: originIcon });
      originMarker.bindPopup(`
        <div style="font-family:'Inter',sans-serif;padding:10px;min-width:160px;">
          <div style="font-size:10px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">🏠 Departure City</div>
          <h4 style="margin:0;font-weight:700;color:#1e1b4b;font-size:14px;">${originName}</h4>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Your starting point for this journey</p>
        </div>
      `, { maxWidth: 220 });
      originMarker.addTo(map);
      markersRef.current.push(originMarker);
      allBounds.push(originCoords);
    }

    // ── 2. DESTINATION center marker ───────────────────────────────────────
    if (destCoords) {
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:48px;height:48px;border-radius:50%;
          background:linear-gradient(135deg,#f59e0b,#ef4444);
          border:3px solid white;
          box-shadow:0 4px 20px rgba(245,158,11,0.45);
          display:flex;align-items:center;justify-content:center;
          font-size:22px;
        ">📍</div>
        <div style="
          position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
          background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;
          font-size:9px;font-weight:800;padding:2px 8px;border-radius:20px;
          white-space:nowrap;font-family:Inter,sans-serif;letter-spacing:0.05em;
        ">DESTINATION</div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -28],
      });
      const destName = destination.split(",")[0];
      const destMarker = L.marker(destCoords, { icon: destIcon });
      destMarker.bindPopup(`
        <div style="font-family:'Inter',sans-serif;padding:10px;min-width:180px;">
          <div style="font-size:10px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">📍 Destination</div>
          <h4 style="margin:0;font-weight:700;color:#1e2420;font-size:14px;">${destName}</h4>
          <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">Your travel destination — explore & enjoy!</p>
        </div>
      `, { maxWidth: 220 });
      destMarker.addTo(map);
      markersRef.current.push(destMarker);
      if (!validPlaces.length) allBounds.push(destCoords);
    }

    // ── 3. Place markers ───────────────────────────────────────────────────
    validPlaces.forEach((place, idx) => {
      const { name, category, latitude, longitude, description, priceRange, rating } = place;
      const catLow = (category || "").toLowerCase();
      let color, emoji, categoryLabel;
      if (catLow.includes("hotel") || catLow.includes("accommodation") || catLow.includes("hostel")) {
        color = "#10b981"; emoji = "🏨"; categoryLabel = "Stay";
      } else if (catLow.includes("restaurant") || catLow.includes("dining") || catLow.includes("food") || catLow.includes("cafe")) {
        color = "#f59e0b"; emoji = "🍽️"; categoryLabel = "Dining";
      } else {
        color = "#8b9c86"; emoji = "🗺"; categoryLabel = "Attraction";
      }

      const placeIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:38px;height:38px;">
          <div style="
            width:38px;height:38px;border-radius:50% 50% 50% 0;
            background:${color};border:3px solid white;
            box-shadow:0 3px 12px rgba(0,0,0,0.25);
            transform:rotate(-45deg);
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;
            transform:translate(-50%,-62%);
            font-size:14px;line-height:1;
          ">${emoji}</div>
          <div style="
            position:absolute;bottom:-3px;right:-5px;
            width:18px;height:18px;border-radius:50%;
            background:white;box-shadow:0 1px 4px rgba(0,0,0,0.2);
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:800;color:${color};
            font-family:Inter,sans-serif;
          ">${idx + 1}</div>
        </div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -42],
      });

      const starsHtml = rating
        ? Array.from({ length: 5 }, (_, i) =>
            `<span style="color:${i < Math.round(rating) ? '#f59e0b' : '#d1d5db'};">★</span>`
          ).join("")
        : "";

      const marker = L.marker([latitude, longitude], { icon: placeIcon });
      marker.bindPopup(`
        <div style="font-family:'Inter',sans-serif;min-width:190px;max-width:230px;padding:12px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:16px;">${emoji}</span>
            <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:${color};font-weight:700;">${categoryLabel} #${idx + 1}</span>
          </div>
          <h4 style="margin:0 0 4px;font-weight:700;color:#1e2420;font-size:13px;line-height:1.3;">${name}</h4>
          <p style="margin:0 0 6px;font-size:11px;color:#6b7280;line-height:1.5;">${description}</p>
          ${starsHtml ? `<div style="margin-bottom:4px;">${starsHtml} <span style="font-size:10px;color:#6b7280;">${rating?.toFixed(1)}</span></div>` : ""}
          ${priceRange ? `<span style="display:inline-block;font-size:10px;font-weight:600;color:${color};background:${color}22;padding:2px 8px;border-radius:100px;">${priceRange}</span>` : ""}
        </div>
      `, { maxWidth: 250 });
      marker.addTo(map);
      markersRef.current.push(marker);
      allBounds.push([latitude, longitude]);
    });

    // ── 4. LOCAL route polyline between places ─────────────────────────────
    const placeLatLngs = validPlaces.map(p => [p.latitude, p.longitude]);
    if (placeLatLngs.length >= 2) {
      const localRoute = L.polyline(placeLatLngs, {
        color: "#8b9c86",
        weight: 3,
        opacity: 0.8,
        dashArray: "10, 7",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      polylinesRef.current.push(localRoute);
    }

    // ── 5. MACRO arc: origin → destination (outbound flight) ────────────────
    if (originCoords && destCoords) {
      const outboundArc = greatCircleArc(originCoords, destCoords);
      const outboundLine = L.polyline(outboundArc, {
        color: "#6366f1",
        weight: 2.5,
        opacity: 0.7,
        dashArray: "14, 8",
        lineCap: "round",
      }).addTo(map);
      outboundLine.bindPopup(`
        <div style="font-family:'Inter',sans-serif;padding:8px;">
          <p style="margin:0;font-size:11px;font-weight:600;color:#6366f1;">✈ Outbound Journey</p>
          <p style="margin:2px 0 0;font-size:10px;color:#6b7280;">${originCity} → ${destination.split(",")[0]}</p>
        </div>
      `);
      polylinesRef.current.push(outboundLine);

      // Return arc: destination → origin (slightly offset for visual clarity)
      const returnArc = greatCircleArc(destCoords, originCoords);
      const returnLine = L.polyline(returnArc, {
        color: "#10b981",
        weight: 2,
        opacity: 0.6,
        dashArray: "6, 10",
        lineCap: "round",
      }).addTo(map);
      returnLine.bindPopup(`
        <div style="font-family:'Inter',sans-serif;padding:8px;">
          <p style="margin:0;font-size:11px;font-weight:600;color:#10b981;">🏠 Return Journey</p>
          <p style="margin:2px 0 0;font-size:10px;color:#6b7280;">${destination.split(",")[0]} → ${originCity}</p>
        </div>
      `);
      polylinesRef.current.push(returnLine);

      // Fit to show both cities + places
      if (allBounds.length > 0) {
        map.fitBounds(allBounds, { padding: [60, 60] });
      }
    } else {
      // No origin — just fit to places
      if (allBounds.length > 0) {
        map.fitBounds(allBounds, { padding: [50, 50] });
      }
    }

  }, [places, destination, originCity, interactive]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ border: "1px solid rgba(139,156,134,0.25)" }}>

      {/* Map Legend — richer */}
      <div className="absolute top-3 right-3 z-[1000] rounded-xl p-3 shadow-md text-xs"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", border: "1px solid rgba(0,0,0,0.08)", minWidth: "140px" }}>
        <p className="font-bold text-slate-700 mb-2 text-[10px] uppercase tracking-wider">Route Guide</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🏠</span>
            <span className="text-[10px] text-slate-600 font-medium">Your Home City</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">📍</span>
            <span className="text-[10px] text-slate-600 font-medium">Destination</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-8 flex-shrink-0" style={{ display: "inline-block" }}>
              <svg width="30" height="6" viewBox="0 0 30 6"><line x1="0" y1="3" x2="30" y2="3" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="8,5" /></svg>
            </span>
            <span className="text-[10px] text-slate-600 font-medium">Outbound ✈</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-8 flex-shrink-0" style={{ display: "inline-block" }}>
              <svg width="30" height="6" viewBox="0 0 30 6"><line x1="0" y1="3" x2="30" y2="3" stroke="#10b981" strokeWidth="2" strokeDasharray="5,7" /></svg>
            </span>
            <span className="text-[10px] text-slate-600 font-medium">Return 🏠</span>
          </div>
          <div className="border-t border-stone-100 mt-0.5 pt-1.5 flex flex-col gap-1">
            {[
              { color: "#10b981", label: "🏨 Hotels" },
              { color: "#f59e0b", label: "🍽️ Dining" },
              { color: "#8b9c86", label: "🗺 Sights" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-slate-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-10" />
    </div>
  );
}
