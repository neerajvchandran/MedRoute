# AI Ambulance Dispatch System – Agent Instructions

## 🎯 Project Goal
Build a full-stack AI-powered ambulance dispatch system that connects patients, ambulance drivers, and hospitals in real time using Google Maps, Firebase, and Gemini AI.

---

## User Roles (Role-Based Authentication)

### During Signup:
User must choose role:
- Patient
- Driver

---

## Patient Features

- Signup/Login (Firebase Auth)
- Request ambulance using current location
- Choose ambulance type:
  - Public (free/government)
  - Private (paid)
- View available ambulances sorted by ETA
- Select ambulance
- Track ambulance live on map
- View ETA updates

---

## Driver Features

- Signup/Login
- During signup, collect:
  - Vehicle Number
  - Ambulance Type (Public/Private)
- Default status = AVAILABLE
- Receive ride requests
- Accept / Reject request
- Once accepted:
  - status → BUSY
- Navigate to patient using map
- View traffic-aware routes
- Update ride status:
  - ON_THE_WAY
  - ARRIVED
  - COMPLETED
- After completion:
  - status → AVAILABLE

---

## Hospital Features

- Dashboard view
- Receive:
  - patient location
  - ETA
  - ambulance details
- Prepare before arrival

---

## Core Features

### Smart Ambulance Selection

- Fetch only drivers where:
  status = AVAILABLE
- Calculate ETA for each driver
- Sort drivers by lowest ETA → highest
- Show list to user

---

### ETA Calculation

ETA = Google ETA + AI Predicted Delay

Where:
- Google ETA → from Directions API
- AI Delay → from Gemini API

---

### AI Integration (Gemini)

Use Gemini to predict future traffic delay.

Input:
- current traffic level
- time of day
- route details

Output:
- predicted delay (minutes)

---

### Map Features (Google Maps)

- Show user location
- Show ambulance markers
- Draw route (driver → patient)
- Enable traffic layer
- Support dynamic rerouting if traffic increases

---

### Real-Time System (Firebase)

Use Firestore / Realtime DB to:
- Store users, drivers, rides
- Update driver location live
- Sync ride status across patient, driver, hospital

---

## Database Structure

### users
- userId
- name
- role (patient/driver)

---

### drivers
- driverId
- name
- vehicleNumber
- ambulanceType (public/private)
- status (AVAILABLE/BUSY)
- currentLocation (lat, lng)

---

### rides
- rideId
- userId
- driverId
- pickupLocation
- ambulanceType
- status
- requestedAt
- acceptedAt
- estimatedETA
- actualTimeTaken

---

## Ride Flow

1. User logs in
2. User requests ambulance
3. System fetches AVAILABLE drivers
4. Calculate ETA using Google + AI
5. Sort drivers by ETA
6. User selects ambulance
7. Driver receives request
8. Driver accepts:
   → status = BUSY
9. Navigation starts
10. If traffic increases:
    → recalculate route
11. Ride completes:
    → store actual time
    → driver becomes AVAILABLE 

---

## Edge Cases

- BUSY drivers must not appear in search
- If driver rejects → assign next best driver
- If road blocked → suggest alternate route
- If no drivers available → show message

---

## Demo Requirements

- Role-based signup (patient/driver)
- Login system
- Request ambulance
- Show sorted ambulance list
- Driver accepts ride
- Live map + route
- Traffic layer visible
- Simulate rerouting

---

## Tech Stack

- Frontend: React
- Backend: Firebase (Auth + Firestore)
- Maps: Google Maps API
- AI: Gemini API

---

## Key Highlight

This system selects the fastest ambulance using real-time traffic and AI-based future prediction instead of simply choosing the nearest one.

---

# 🔮 Simulation & Demo Behavior (Prototype Enhancement)

To ensure a realistic and interactive demo experience without requiring large-scale real-world datasets, the system incorporates simulation techniques alongside real APIs.

---

## 🌍 Real-World Location Demo

- Supports real location scenarios using Google Maps
- Example:
  - Patient in Thiruvalla
  - Driver in Changanassery
- Distance and base ETA fetched via Google Maps Directions API

---

## ⏱️ Enhanced ETA Calculation

Final ETA = Google Maps ETA + AI Predicted Delay + Dynamic Variation

Where:
- Google ETA → real-time traffic-aware estimate
- AI Delay → predicted using Gemini
- Dynamic Variation → small random delay (1–3 minutes)

---

## 🤖 AI Delay Simulation (Gemini)

Gemini is used for reasoning, not training.

**Inputs:**
- Time of day
- Traffic level
- Route type

**Output:**
- Predicted delay (minutes)

---

## 📊 Simulated Historical Traffic Patterns

- Morning (8–10 AM) → High traffic
- Evening (5–8 PM) → Peak traffic
- Night → Low traffic

Used to influence:
- ETA adjustments
- AI delay estimation

---

## 🔄 Dynamic Traffic Updates

- System simulates traffic changes during ride
- Example:
  - “Traffic increased due to congestion”
- Recalculates:
  - Route
  - ETA

---

## 🎬 Demo Flow Enhancements

1. User requests ambulance
2. System shows sorted drivers by ETA
3. User selects driver
4. Map displays route with traffic layer
5. Initial ETA shown
6. After a few seconds:
   - Traffic update simulated
   - ETA recalculated

---

## ⚠️ Note on Data Usage

- Real-time ETA from Google Maps APIs
- No raw traffic datasets used
- AI uses prompt-based reasoning (Gemini)
- Historical data is simulated for demo purposes

---

## 🧠 Design Philosophy

Focuses on:
- Intelligent decision-making
- Real-time adaptability
- Realistic simulation

Instead of replicating full-scale infrastructure like Uber or Google Maps.