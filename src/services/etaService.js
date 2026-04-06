export async function calculateRouteETA(origin, destination, googleMapsLoaded) {
  if (!googleMapsLoaded || !window.google) {
    return {
      distance: { text: "Simulated 5 km", value: 5000 },
      duration: { text: "Simulated 10 mins", value: 600 },
      polyline: null
    };
  }

  const directionsService = new window.google.maps.DirectionsService();
  try {
    const results = await directionsService.route({
      origin,
      destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });
    
    const route = results.routes[0];
    const leg = route.legs[0];
    return {
      distance: leg.distance,
      duration: leg.duration,
      polyline: route.overview_polyline,
      resultPoints: results
    };
  } catch (error) {
    console.error("Directions query failed", error);
    throw new Error('Failed to find route via Google Maps');
  }
}

export async function askGeminiForTrafficDelay(timeOfDay, distanceText, durationText) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API key missing, substituting mock delay.");
    return Math.floor(Math.random() * 5); // 0-4 min random delay mock
  }

  const prompt = `You are an AI calculating traffic delay for an ambulance dispatch system. 
Given:
- Time of Day: ${timeOfDay}
- Base Route Length: ${distanceText}
- Base Google ETA: ${durationText}
Return ONLY a single integer representing an estimated traffic delay in minutes (do not add any words or markdown). Consider that morning (8-10 AM) and evening (5-8 PM) are rush hours which add significant delays (e.g. 5-15 mins). Night trips add 0-2 mins. Add some dynamic variations.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const textResponse = data.candidates[0].content.parts[0].text;
      const parsedDelay = parseInt(textResponse.trim(), 10);
      return isNaN(parsedDelay) ? 2 : parsedDelay;
    }
  } catch (err) {
    console.error("Gemini delay prediction failed", err);
  }
  return 2; // Default delay fallback
}
