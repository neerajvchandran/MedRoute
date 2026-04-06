import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'patient') navigate('/patient');
      else if (userRole === 'driver') navigate('/driver');
      else if (userRole === 'hospital') navigate('/hospital');
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError('Failed to log in: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div className="glass-card" style={{width: '400px', maxWidth: '90%'}}>
        <h2 style={{textAlign: 'center', marginBottom: '1.5rem'}}>Sign In</h2>
        {error && <div style={{color: 'var(--accent-red)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem'}}>{error}</div>}
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          <button type="submit" className="btn-primary" style={{marginTop: '0.5rem'}} disabled={loading}>
            {loading ? 'Entering...' : 'Confirm'}
          </button>
        </form>
        <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <p>Don't have an account? <Link to="/signup" style={{color: 'var(--accent-blue)', textDecoration: 'none'}}>Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
}
