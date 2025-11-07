import React, { useState } from 'react';
import './Signup.css';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Signup(){
  const [form, setForm] = useState({name:'', email:'', org:'', role:'', password:'', confirm:''});
  const [error, setError] = useState('');
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
    if(!form.password || form.password !== form.confirm){
      setError('Passwords must match');
      return;
    }
    // obtain recaptcha token if available
    let recaptcha_token = null;
    try{
      const enabled = process.env.REACT_APP_RECAPTCHA_ENABLED || '1';
      if(enabled && !['0','false','no'].includes(String(enabled).toLowerCase())){
        if(window.grecaptcha && window.grecaptcha.enterprise){
          await new Promise((res, rej) => {
            window.grecaptcha.enterprise.ready(async () => {
              try{
                const t = await window.grecaptcha.enterprise.execute('6Ld6UewrAAAAAKAMsr7P4ByFkkKM3rzaRQCKcx73', {action: 'SIGNUP'});
                recaptcha_token = t;
                res();
              }catch(err){ res(); }
            });
          });
        }
      }
    }catch(err){ /* ignore grecaptcha errors */ }

    // call backend signup
    try{
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username: form.name, email: form.email, password: form.password, recaptcha_token })
      });
      if(res.ok){
        const data = await res.json();
        // show verification modal and poll for verification
        showVerificationModal(data.email);
        return;
      } else {
        const data = await res.json().catch(()=>({detail:'Signup failed'}));
        setError(data.detail || 'Signup failed');
      }
    }catch(err){
      console.error('Network error during signup', err);
      setError('Network error during signup');
    }
  };

  // Verification modal state and polling
  const [verifying, setVerifying] = React.useState(false);
  const [verifyEmailAddr, setVerifyEmailAddr] = React.useState('');
  const showVerificationModal = (email) => {
    setVerifyEmailAddr(email);
    setVerifying(true);
    // start polling every 3s
    const iv = setInterval(async () => {
      try{
        const res = await fetch(`${API_URL}/api/auth/poll-verification?email=${encodeURIComponent(email)}`);
        if(res.ok){
          const d = await res.json();
          if(d.email_verified){
            clearInterval(iv);
            setVerifying(false);
            // at this point, backend's verify-email already issued token; poll endpoint returns token
            if(d.token){
              // complete login
              try{ await auth.login({ token: d.token }); }catch(e){}
              navigate('/search');
              return;
            }
          }
        }
      }catch(err){ /* ignore */ }
    }, 3000);
  };

  return (
    <div>
      <Header />
      <div className="signup-root">
      <div className="signup-header">Sign up for free and access the full platform</div>
      <form className="signup-form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="org" placeholder="Organization/Company/Uni ex: LeData" value={form.org} onChange={handleChange} />
        <input name="role" placeholder="Role/Title" value={form.role} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <input name="confirm" type="password" placeholder="Confirm Password" value={form.confirm} onChange={handleChange} />
        {error && <div className="signup-error">{error}</div>}
        <div className="signup-terms">By signing up, I agree to the terms and privacy policy of LeData</div>
        <div className="recaptcha-container">
          {/* Placeholder for recaptcha checkbox (enterprise execute is invisible); visual match */}
          <div id="recaptcha-placeholder" style={{width:300, height:60}} />
        </div>
        <button className="signup-btn-main" type="submit">Sign up</button>
        <div className="signup-login-link">Already a user? <a href="/login">Login</a></div>
      </form>
    </div>
    </div>
  );
}
