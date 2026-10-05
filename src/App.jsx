import { useEffect, useState } from 'react';
import Login from './components/Login.jsx';
import Products from './components/Products.jsx';
import { session, logout as apiLogout } from './api.js';

export default function App() {
  const [user, setUser] = useState(() => (session.access ? session.user : null));

  // The API client fires this when the session can no longer be refreshed.
  useEffect(() => {
    const onForcedLogout = () => setUser(null);
    window.addEventListener('auth:logout', onForcedLogout);
    return () => window.removeEventListener('auth:logout', onForcedLogout);
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout(); // revokes the refresh token on the server
    } catch {
      /* even if the request fails, log out locally */
    }
    session.clear();
    setUser(null);
  };

  return user ? (
    <Products user={user} onLogout={handleLogout} />
  ) : (
    <Login onLoggedIn={setUser} />
  );
}
