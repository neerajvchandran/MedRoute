import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/dispatch` 
  : 'http://localhost:5000/api/dispatch';

export default function HospitalDashboard() {
  const [incomingRides, setIncomingRides] = useState([]);

  useEffect(() => {
    const fetchIncomingRides = async () => {
      try {
        const res = await fetch(`${API_URL}/rides/active?role=hospital`);
        if (res.ok) {
          const data = await res.json();
          setIncomingRides(data || []);
        }
      } catch(e) {}
    };

    fetchIncomingRides();
    const interval = setInterval(fetchIncomingRides, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{padding: '2rem'}}>
      <div className="glass-card" style={{marginBottom: '2rem'}}>
        <h2>Hospital Operations Dashboard (MongoDB)</h2>
        <p>Monitor all active ambulance dispatch requests and ETAs for triage preparation.</p>
      </div>

      <div className="glass-card">
        <h3 style={{marginBottom: '1rem'}}>Incoming Emergency Units</h3>
        {incomingRides.length === 0 ? (
          <p style={{color: 'var(--text-secondary)'}}>No active ambulances currently in deployment.</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {incomingRides.map(ride => (
              <div key={ride._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)'}}>
                <div>
                  <strong>Driver:</strong> {ride.driverName} ({ride.vehicleNumber}) <br/>
                  <small>Type: {ride.ambulanceType} | Status: <span style={{color: ride.status === 'ARRIVED' ? 'var(--accent-red)' : 'var(--accent-blue)'}}>{ride.status}</span></small>
                </div>
                <div style={{textAlign: 'right'}}>
                  <strong>{ride.estimatedETAMinutes} min</strong>
                  <br/><small>AI Verified ETA</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
