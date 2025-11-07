import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import './Header.css';

export default function Header(){
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    function handleOutside(e){
      if(menuRef.current && !menuRef.current.contains(e.target)){
        setMenuOpen(false);
      }
    }
    if(menuOpen){
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="header-left">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <Link to="/" className="site-logo">{'{Le}Data'}</Link>
          <div className="social-row">
            <a className="social-icon" href="https://github.com" title="github" target="_blank" rel="noopener noreferrer">
              <img src={process.env.PUBLIC_URL + '/github.png'} alt="github" className="social-icon-image" />
            </a>
            <a className="social-icon" href="https://twitter.com" title="twitter" target="_blank" rel="noopener noreferrer">
              <img src={process.env.PUBLIC_URL + '/twitter.png'} alt="twitter" className="social-icon-image" />
            </a>
            <a className="social-icon" href="https://linkedin.com" title="linkedin" target="_blank" rel="noopener noreferrer">
              <img src={process.env.PUBLIC_URL + '/linkedin.png'} alt="linkedin" className="social-icon-image" />
            </a>
          </div>
        </div>
      </div>
      <div className="header-right">
        <nav className="site-nav">
          <a className="nav-link" href="#">Dashboard</a>
          <a className="nav-link" href="#">Data</a>
          <a className="nav-link" href="#">Services</a>
        </nav>
        {user ? (
          <div className="header-user">
            <div className="user-menu" ref={menuRef}>
              <button className="hi-user-btn" onClick={() => setMenuOpen((s) => !s)}>
                Hi {user.username} <span className="caret">▾</span>
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>Profile</button>
                  <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="header-auth">
            <Link to="/login" className="login-link">Login</Link>
            <Link to="/signup" className="signup-btn">Signup for free</Link>
          </div>
        )}
        {!['/','/login','/signup'].includes(location.pathname) && (
          <div className="header-add">
            <button className="add-btn" onClick={() => navigate('/add-dataset')} aria-label="Add dataset">Add</button>
            <div className="add-arrow" onClick={() => navigate('/add-dataset')} style={{cursor:'pointer'}}>[↦]</div>
          </div>
        )}
      </div>
    </header>
  );
}
