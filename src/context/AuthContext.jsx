import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// API Service für Auth-Anfragen
import { login, refreshToken, getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshTokenValue, setRefreshTokenValue] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Beim ersten Laden prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Benutzerinformationen abrufen
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (err) {
          // Bei Fehler: Token möglicherweise abgelaufen, versuche zu aktualisieren
          try {
            if (refreshTokenValue) {
              const newToken = await refreshToken(refreshTokenValue);
              setToken(newToken.accessToken);
              localStorage.setItem('token', newToken.accessToken);
              
              // Erneut Benutzerinformationen abrufen
              const userData = await getCurrentUser();
              setUser(userData);
            } else {
              // Kein Refresh-Token vorhanden, Benutzer ausloggen
              logout();
            }
          } catch (refreshErr) {
            // Refresh fehlgeschlagen, Benutzer ausloggen
            logout();
            setError('Sitzung abgelaufen. Bitte erneut anmelden.');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, refreshTokenValue]);

  // Login-Funktion
  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await login(email, password);
      setUser(data);
      setToken(data.token);
      setRefreshTokenValue(data.refreshToken);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout-Funktion
  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshTokenValue(null);
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    navigate('/login');
  };

  // Werte, die über den Context bereitgestellt werden
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login: loginUser,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

