import React, { useState } from 'react';
import './Login.css';
import Header from './Header';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './auth';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export default function Login(){
  const [form, setForm] = useState({email:'', password:''});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  // If token present and valid, redirect to search
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try{
        const token = localStorage.getItem('ledata_token');
        if(token){
          const res = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
          if(res.ok && mounted){
            navigate('/search');
            return;
          }
        }
      }catch(e){}
    })();
    return () => { mounted = false };
  }, [navigate]);

  const handleChange = e => setForm(f => ({...f, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // obtain recaptcha token if available and enabled via env
    let recaptcha_token = null;
    try{
      const enabled = process.env.REACT_APP_RECAPTCHA_ENABLED || '1';
      if(enabled && !['0','false','no'].includes(String(enabled).toLowerCase())){
        if(window.grecaptcha && window.grecaptcha.enterprise){
          await new Promise((res, rej) => {
            window.grecaptcha.enterprise.ready(async () => {
              try{
                const t = await window.grecaptcha.enterprise.execute('6Ld6UewrAAAAAKAMsr7P4ByFkkKM3rzaRQCKcx73', {action: 'LOGIN'});
                recaptcha_token = t;
              }catch(err){ /* ignore token errors */ }
              res();
            });
          });
        }
      }
    }catch(err){ /* ignore grecaptcha errors */ }

    try{
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email_or_username: form.email, password: form.password, recaptcha_token })
      });
      if(res.ok){
        const data = await res.json();
        try{ await auth.login(data); }catch(e){ console.error('Error during auth.login', e); }
        navigate('/search');
      } else {
        const data = await res.json().catch(()=>({detail:'Login failed'}));
        setError(data.detail || 'Login failed');
      }
    }catch(err){
      console.error('Network error during login', err);
      setError('Network error');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="login-root">
      {loading && (
        <div className="login-loading-overlay">
          <div className="login-spinner" />
        </div>
      )}
      <div className="login-header">Log in</div>
      <form className="login-form" onSubmit={handleSubmit}>
  <input name="email" placeholder="Registered Email" value={form.email} onChange={handleChange} disabled={loading} />
  <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} disabled={loading} />
  <div className="login-forgot"><Link to="/forgot-password">Forgot password?</Link></div>
        {error && <div className="login-error">{error}</div>}
  <button className="login-btn-main" type="submit" disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
  <div className="login-signup">Sign up if you are new here — <Link to="/signup">Create account</Link></div>
      </form>
    </div>
    </div>
  );
}
