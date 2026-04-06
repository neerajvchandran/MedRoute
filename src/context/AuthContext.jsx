import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/auth` 
    : 'http://localhost:5000/api/auth';

  useEffect(() => {
    // Check localStorage for token on boot
    const token = localStorage.getItem('ambulanceToken');
    const role = localStorage.getItem('ambulanceRole');
    const userId = localStorage.getItem('ambulanceUserId');
    const name = localStorage.getItem('ambulanceName');

    if (token && userId) {
      setCurrentUser({ uid: userId, name });
      setUserRole(role);
    }
    setLoading(false);
  }, []);

  const saveAuth = (data) => {
    localStorage.setItem('ambulanceToken', data.token);
    localStorage.setItem('ambulanceRole', data.role);
    localStorage.setItem('ambulanceUserId', data.userId);
    localStorage.setItem('ambulanceName', data.name);
    setCurrentUser({ uid: data.userId, name: data.name });
    setUserRole(data.role);
  };

  async function login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    saveAuth(data);
    return data;
  }

  async function signupPatient(email, password, name) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'patient', email, password, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    saveAuth(data);
    return data;
  }

  async function signupDriver(email, password, name, vehicleNumber, ambulanceType) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'driver', email, password, name, vehicleNumber, ambulanceType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    saveAuth(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('ambulanceToken');
    localStorage.removeItem('ambulanceRole');
    localStorage.removeItem('ambulanceUserId');
    localStorage.removeItem('ambulanceName');
    setCurrentUser(null);
    setUserRole(null);
  }

  const value = {
    currentUser,
    userRole,
    login,
    signupPatient,
    signupDriver,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
