import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { calculateRouteETA, askGeminiForTrafficDelay } from '../../services/etaService';

const containerStyle = { width: '100%', height: '400px', borderRadius: '12px' };
const defaultCenter = { lat: 9.3831, lng: 76.5741 }; // Demo standard coordinate (e.g. Thiruvalla area)

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/dispatch` 
  : 'http://localhost:5000/api/dispatch';

export default function PatientDashboard() {
  const { currentUser, logout } = useAuth();
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });

  const [ambType, setAmbType] = useState('any'); // public, private, any
  const [patientLoc, setPatientLoc] = useState(defaultCenter);
  const [statusMsg, setStatusMsg] = useState('Hover over the map to set pickup location.');
  
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const [activeRide, setActiveRide] = useState(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setPatientLoc({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => console.warn("Using default location.")
      );
    }
  }, []);

  // Poll for Active Ride status (MongoDB Polling replacement for Firebase onSnapshot)
  useEffect(() => {
    if (!currentUser) return;
    const fetchActiveRide = async () => {
      try {
        const res = await fetch(`${API_URL}/rides/active?userId=${currentUser.uid}&role=patient`);
        if (res.ok) {
          const data = await res.json();
          if (data && data._id) {
            setActiveRide({...data, rideId: data._id});
          } else {
            setActiveRide(null);
          }
        }
      } catch(err) { console.error("Polling error", err); }
    };

    fetchActiveRide(); // initial fetch
    const interval = setInterval(fetchActiveRide, 3000); // Polling every 3 secs
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleSearch = async () => {
    setLoadingSearch(true);
    try {
      setStatusMsg('Locating available ambulances...');
      // 1. Fetch available drivers from MongoDB
      const res = await fetch(`${API_URL}/drivers/available?type=${ambType}`);
      const drivers = await res.json();

      if (!drivers || drivers.length === 0) {
        setStatusMsg('No ambulances available matching your criteria.');
        setAvailableDrivers([]);
        setLoadingSearch(false);
        return;
      }

      setStatusMsg('Calculating smart ETAs using AI and Traffic patterns...');

      // 2. Assess ETAs
      const driversWithETA = await Promise.all(drivers.map(async (driver) => {
        const driverLoc = driver.currentLocation || { lat: patientLoc.lat + 0.05, lng: patientLoc.lng + 0.05 }; 
        let directionsRes = null;
        let baseMins = 10;
        let distanceTxt = "5 km";
        let durationTxt = "10 mins";

        try {
          const etaRes = await calculateRouteETA(driverLoc, patientLoc, isLoaded);
          directionsRes = etaRes;
          distanceTxt = etaRes.distance.text;
          durationTxt = etaRes.duration.text;
          baseMins = Math.ceil(etaRes.duration.value / 60);
        } catch(e) { console.warn("Using fallback ETA"); }

        // Ask Gemini
        const timeOfDay = new Date().toLocaleTimeString();
        const aiDelay = await askGeminiForTrafficDelay(timeOfDay, distanceTxt, durationTxt);
        const dynamicVar = Math.floor(Math.random() * 3) + 1; // 1-3 mins
        const finalETAMinutes = baseMins + aiDelay + dynamicVar;

        return { ...driver, driverLoc, baseMins, aiDelay, finalETAMinutes, distanceTxt };
      }));

      // 3. Sort drivers by ETA
      driversWithETA.sort((a, b) => a.finalETAMinutes - b.finalETAMinutes);
      setAvailableDrivers(driversWithETA);
      setStatusMsg('');
    } catch (e) {
      console.error(e);
      setStatusMsg('Error fetching ambulances: ' + e.message);
    }
    setLoadingSearch(false);
  };

  const selectAmbulance = async (driver) => {
    try {
      setStatusMsg('Booking ambulance...');
      // Create ride in MongoDB
      const res = await fetch(`${API_URL}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.uid,
          driverId: driver.driverId,
          patientLocation: patientLoc,
          ambulanceType: driver.ambulanceType,
          driverName: driver.name,
          vehicleNumber: driver.vehicleNumber,
          estimatedETAMinutes: driver.finalETAMinutes
        })
      });
      const newRide = await res.json();

      // Show route
      const etaRes = await calculateRouteETA(driver.driverLoc, patientLoc, isLoaded);
      if (etaRes && etaRes.resultPoints) setDirections(etaRes.resultPoints);

      setActiveRide({ rideId: newRide._id, status: 'PENDING', ...driver });
      setStatusMsg('Ride successfully requested! Waiting for driver to accept...');
      setAvailableDrivers([]);
    } catch (err) {
      setStatusMsg('Failed to book: ' + err.message);
    }
  };

  return (
    <div style={{padding: '2rem'}}>
      <div className="glass-card" style={{marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h2>Patient Dashboard (MongoDB)</h2>
          <p>Welcome. Request your AI-powered ambulance dispatch.</p>
          {activeRide && (
             <h3 style={{color: 'var(--accent-blue)', marginTop: '0.5rem'}}>Status: {activeRide.status}</h3>
          )}
        </div>
        <button className="btn-danger" onClick={() => { if(logout) {logout();} else {window.location.reload();}}} style={{padding: '0.5rem 1rem'}}>Logout</button>
      </div>

      <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
        <div className="glass-card" style={{flex: '1 1 400px'}}>
          <h3 style={{marginBottom:'1rem'}}>Live Map Tracker</h3>
          {isLoaded ? (
            <GoogleMap mapContainerStyle={containerStyle} center={patientLoc} zoom={13} options={{ mapId: 'DEMO_MAP_ID', disableDefaultUI: true }}>
              <Marker position={patientLoc} label="You" />
              {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: 'var(--accent-blue)', strokeWeight: 5 } }} />}
            </GoogleMap>
          ) : <p>Loading map...</p>}
        </div>

        <div className="glass-card" style={{flex: '1 1 300px'}}>
          {!activeRide ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3>Find an Ambulance</h3>
              <select value={ambType} onChange={e => setAmbType(e.target.value)}>
                <option value="any">Any Type</option>
                <option value="public">Public (Government)</option>
                <option value="private">Private (Paid)</option>
              </select>
              <button className="btn-primary" onClick={handleSearch} disabled={loadingSearch}>
                {loadingSearch ? 'Scanning AI Predictions...' : 'Search Available'}
              </button>
              
              <p style={{color: 'var(--accent-green)', fontWeight: '500', fontSize: '0.9rem'}}>{statusMsg}</p>

              {availableDrivers.length > 0 && (
                <div className="animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
                  <h4>Available Options (Sorted by AI ETA)</h4>
                  {availableDrivers.map(drv => (
                    <div key={drv.driverId} className="glass-card" style={{padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} onClick={() => selectAmbulance(drv)}>
                      <div>
                        <strong>{drv.vehicleNumber}</strong> - {drv.ambulanceType}<br/>
                        <small>{drv.distanceTxt} away</small>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <strong style={{fontSize: '1.2rem', color: 'var(--accent-red)'}}>{drv.finalETAMinutes} min</strong><br/>
                        <small style={{opacity: 0.6}}>Includes +{drv.aiDelay}m traffic</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3>Tracking Ride</h3>
              <div className="glass-card" style={{padding: '1rem', border: '1px solid var(--accent-blue)'}}>
                <p><strong>{activeRide.vehicleNumber || activeRide.driverName}</strong></p>
                <p>Est. Arrival: {activeRide.estimatedETAMinutes || activeRide.finalETAMinutes} minutes</p>
                <hr style={{margin: '1rem 0', borderColor: 'rgba(255,255,255,0.1)'}} />
                {activeRide.status === 'PENDING' && <p>Waiting for driver to accept...</p>}
                {activeRide.status === 'BUSY' && <p style={{color: 'var(--accent-green)'}}>Driver Accepted! They are preparing.</p>}
                {activeRide.status === 'ON_THE_WAY' && <p style={{color: 'orange'}}>Ambulance is ON THE WAY.</p>}
                {activeRide.status === 'ARRIVED' && <p style={{color: 'var(--accent-green)'}}>Emergency vehicle has ARRIVED.</p>}
                {activeRide.status === 'COMPLETED' && (
                   <button className="btn-primary" onClick={() => setActiveRide(null)}>Dismiss Ride Tracking</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
