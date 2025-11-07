import React, { useState } from 'react';
import './Signup.css';
import Header from './Header';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // attempt to obtain recaptcha token (will be included when backend exists)
    let recaptcha_token = null;
    try{
      const enabled = process.env.REACT_APP_RECAPTCHA_ENABLED || '1';
      if(enabled && !['0','false','no'].includes(String(enabled).toLowerCase())){
        if(window.grecaptcha && window.grecaptcha.enterprise){
          await new Promise((res, rej) => {
            window.grecaptcha.enterprise.ready(async () => {
              try{
                const t = await window.grecaptcha.enterprise.execute('6Ld6UewrAAAAAKAMsr7P4ByFkkKM3rzaRQCKcx73', {action: 'FORGOT_PASSWORD'});
                recaptcha_token = t;
                res();
              }catch(err){ res(); }
            });
          });
        }
      }
    }catch(err){ }

    // Placeholder: we don't have a forgot-password backend yet; simulate
    // In the future POST to /api/auth/forgot-password with { email, recaptcha_token }
    setSent(true);
  };

  return (
    <div>
      <Header />
      <div className="signup-root">
      <div className="signup-header">Reset your password</div>
      {!sent ? (
        <form className="signup-form" onSubmit={handleSubmit}>
          <input name="email" placeholder="Enter your registered email" value={email} onChange={e => setEmail(e.target.value)} />
          <div style={{marginTop:12}}>
            <button className="signup-btn-main" type="submit">Send reset link</button>
          </div>
        </form>
      ) : (
        <div style={{padding:20}}>If an account with that email exists, we've sent password reset instructions.</div>
      )}
    </div>
    </div>
  );
}
