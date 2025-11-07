import React, { createContext, useContext, useState } from 'react';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AuthContext = createContext(null);

export function AuthProvider({children}){
  const [user, setUser] = useState(null);
  // on init, try to load token and fetch user details
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try{
        const token = localStorage.getItem('ledata_token');
        if(token){
          const res = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
          if(res.ok){
            const data = await res.json();
            if(mounted) setUser({ ...data, token });
            return;
          }
        }
      }catch(e){}
      if(mounted) setUser(null);
    })();
    return () => { mounted = false };
  }, []);

  const login = async (loginResponse) => {
    // loginResponse expected to include token; store token only
    const token = loginResponse?.token;
    if(!token) return;
    try{ localStorage.setItem('ledata_token', token); }catch(e){}
    // fetch full user details
    try{
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok){
        const data = await res.json();
        setUser({ ...data, token });
      }
    }catch(e){}
  };

  const refreshUser = async () => {
    try{
      const token = localStorage.getItem('ledata_token');
      if(!token) return setUser(null);
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok){
        const data = await res.json();
        setUser({ ...data, token });
        return data;
      }
    }catch(e){}
    return null;
  };

  const logout = async () => {
    try{
      const token = localStorage.getItem('ledata_token');
      if(token){
        await fetch('/api/auth/logout', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token})});
      }
    }catch(e){}
    setUser(null);
    try{ localStorage.removeItem('ledata_token'); }catch(e){}
  };
  return (
    <AuthContext.Provider value={{user, login, logout, refreshUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  return useContext(AuthContext);
}
