import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("campuscare_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("campuscare_user")); } catch { return null; }
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (!token) { setReady(true); return; }
    api("/api/auth/me").then(d => {
      if (active) { setUser(d.user); sessionStorage.setItem("campuscare_user", JSON.stringify(d.user)); }
    }).catch(() => {
      sessionStorage.removeItem("campuscare_token"); sessionStorage.removeItem("campuscare_user");
      if (active) { setToken(null); setUser(null); }
    }).finally(() => active && setReady(true));
    return () => { active = false; };
  }, []);
  const login = (t, u) => {
    sessionStorage.setItem("campuscare_token", t); sessionStorage.setItem("campuscare_user", JSON.stringify(u));
    setToken(t); setUser(u);
  };
  const logout = () => {
    sessionStorage.removeItem("campuscare_token"); sessionStorage.removeItem("campuscare_user");
    setToken(null); setUser(null);
  };
  return <AuthContext.Provider value={{token,user,ready,login,logout}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
