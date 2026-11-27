import { createContext, useContext, useState } from 'react';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// auth = { role: 'student' | 'alumni', user: { id, name, email } }
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() =>
    JSON.parse(localStorage.getItem('auth') || 'null'));

  const login = (data) => {
    localStorage.setItem('auth', JSON.stringify(data));
    setAuth(data);
  };
  const logout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
  };
  return (
    <AuthCtx.Provider value={{ auth, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
