import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { calculateRouteETA } from '../../services/etaService';

const containerStyle = { width: '100%', height: '400px', borderRadius: '12px' };
const defaultCenter = { lat: 9.4231, lng: 76.5341 };

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/dispatch` 
  : 'http://localhost:5000/api/dispatch';

export default function DriverDashboard() {
  const { currentUser, logout } = useAuth();
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });
  
  const [driverData, setDriverData] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [directions, setDirections] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  // Polling for Driver Data & Active Requests
  useEffect(() => {
    if (!currentUser) return;

    const fetchDriverData = async () => {
      try {
        const res = await fetch(`${API_URL}/drivers/me?userId=${currentUser.uid}`);
        if(res.ok) setDriverData(await res.json());
      } catch(e) {}
    };

    const fetchActiveRequest = async () => {
      try {
        const res = await fetch(`${API_URL}/rides/active?userId=${currentUser.uid}&role=driver`);
        if (res.ok) {
          const reqData = await res.json();
          if (reqData && reqData._id) {
            setActiveRequest({ ...reqData, id: reqData._id });
          } else {
            setActiveRequest(null);
          }
        }
      } catch(e) {}
    };

    fetchDriverData();
    fetchActiveRequest();
    const interval = setInterval(fetchActiveRequest, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle route calculation strictly once per ride to avoid map flashing
  useEffect(() => {
    if (!isLoaded || !activeRequest?.patientLocation) {
      setDirections(null);
      return;
    }
    const drvLoc = driverData?.currentLocation?.lat ? driverData.currentLocation : defaultCenter;
    
    calculateRouteETA(drvLoc, activeRequest.patientLocation, true)
      .then(etaRes => {
        if (etaRes?.resultPoints) setDirections(etaRes.resultPoints);
      })
      .catch(e => console.error("Could not trace route.", e));
  }, [activeRequest?.id, isLoaded]);

  const updateRideStatus = async (newStatus) => {
    try {
      setStatusMsg('Updating status...');
      await fetch(`${API_URL}/rides/${activeRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, driverId: currentUser.uid })
      });
      setStatusMsg('');
    } catch (err) {
      console.error(err);
      setStatusMsg('Update failed.');
    }
  };

  const rejectRide = async () => {
    await updateRideStatus('REJECTED');
  };

  if (!driverData) return <div style={{padding: '2rem'}}>Loading driver profile...</div>;

  return (
    <div style={{padding: '2rem'}}>
      <div className="glass-card" style={{marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h2>Driver Dashboard (MongoDB)</h2>
          <p>Vehicle: {driverData.vehicleNumber} | Status: <strong style={{color: driverData.status === 'AVAILABLE' ? 'var(--accent-green)' : 'var(--accent-red)'}}>{driverData.status}</strong></p>
        </div>
        <button className="btn-danger" onClick={logout} style={{padding: '0.5rem 1rem'}}>Logout</button>
      </div>

      <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
        <div className="glass-card" style={{flex: '1 1 400px'}}>
          <h3 style={{marginBottom:'1rem'}}>Navigation</h3>
          {isLoaded ? (
            <GoogleMap mapContainerStyle={containerStyle} center={driverData.currentLocation || defaultCenter} zoom={13} options={{ mapId: 'DEMO_MAP_ID', disableDefaultUI: true }}>
              <Marker position={driverData.currentLocation || defaultCenter} label="Me" />
              {activeRequest?.patientLocation && <Marker position={activeRequest.patientLocation} label="Pickup" />}
              {directions && <DirectionsRenderer directions={directions} options={{ polylineOptions: { strokeColor: 'var(--accent-red)', strokeWeight: 5 } }} />}
            </GoogleMap>
          ) : <p>Loading map...</p>}
        </div>

        <div className="glass-card" style={{flex: '1 1 300px'}}>
          <h3>Dispatch Orders</h3>
          {statusMsg && <p style={{color: 'orange'}}>{statusMsg}</p>}
          
          {!activeRequest ? (
            <p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>No active requests. You are available for dispatch.</p>
          ) : (
            <div className="animate-fade-in" style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              
              <div style={{padding: '1rem', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-sm)'}}>
                <h4 style={{color: 'var(--accent-blue)'}}>INCOMING EMERGENCY</h4>
                <p><strong>ETA generated:</strong> {activeRequest.estimatedETAMinutes} min</p>
                <p><strong>Type:</strong> {activeRequest.ambulanceType}</p>
              </div>

              {activeRequest.status === 'PENDING' && (
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button className="btn-success" style={{flex: 1}} onClick={() => updateRideStatus('BUSY')}>Accept</button>
                  <button className="btn-danger" style={{flex: 1}} onClick={rejectRide}>Reject</button>
                </div>
              )}

              {activeRequest.status === 'BUSY' && (
                <button className="btn-primary" onClick={() => updateRideStatus('ON_THE_WAY')}>Start Trip (On The Way)</button>
              )}

              {activeRequest.status === 'ON_THE_WAY' && (
                <button className="btn-success" onClick={() => updateRideStatus('ARRIVED')}>Mark as ARRIVED</button>
              )}

              {activeRequest.status === 'ARRIVED' && (
                <button className="btn-danger" style={{backgroundColor: 'purple'}} onClick={() => updateRideStatus('COMPLETED')}>Complete Rescue</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
