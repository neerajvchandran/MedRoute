import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Driver specific fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ambulanceType, setAmbulanceType] = useState('public');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupPatient, signupDriver, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'patient') navigate('/patient');
      else if (userRole === 'driver') navigate('/driver');
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (role === 'patient') {
        await signupPatient(email, password, name);
      } else {
        await signupDriver(email, password, name, vehicleNumber, ambulanceType);
      }
    } catch (err) {
      setError('Failed to create account: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem'}}>
      <div className="glass-card" style={{width: '450px', maxWidth: '100%'}}>
        <h2 style={{textAlign: 'center', marginBottom: '1.5rem'}}>Create Account</h2>
        {error && <div style={{color: 'var(--accent-red)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem'}}>{error}</div>}
        
        <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
          <button type="button" onClick={() => setRole('patient')} className={role === 'patient' ? 'btn-primary' : ''} style={{flex: 1, backgroundColor: role !== 'patient' ? 'rgba(255,255,255,0.1)' : ''}}>Patient</button>
          <button type="button" onClick={() => setRole('driver')} className={role === 'driver' ? 'btn-primary' : ''} style={{flex: 1, backgroundColor: role !== 'driver' ? 'rgba(255,255,255,0.1)' : ''}}>Driver</button>
        </div>

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} disabled={loading} />
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          <input type="password" placeholder="Password (min 6 chars)" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          
          {role === 'driver' && (
            <div className="animate-fade-in" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <input type="text" placeholder="Vehicle Number (e.g. KL 01 AB 1234)" required value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} disabled={loading} />
              <select value={ambulanceType} onChange={e => setAmbulanceType(e.target.value)} disabled={loading}>
                <option value="public">Public (Free/Government)</option>
                <option value="private">Private (Paid)</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{marginTop: '0.5rem'}} disabled={loading}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>
        <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <p>Already have an account? <Link to="/login" style={{color: 'var(--accent-blue)', textDecoration: 'none'}}>Log In</Link></p>
        </div>
      </div>
    </div>
  );
}
