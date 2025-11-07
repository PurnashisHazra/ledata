import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

export default function Footer(){
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <h2>Power To The Builders<br/>Of This Galaxy</h2>
          <div className="footer-contact">hello@reallygreatsite.com</div>
          <div className="footer-legal">Terms&nbsp; Privacy&nbsp; Imprint</div>
          <div className="footer-icons">
            <Link to="#" className="social-icon"><img src={process.env.PUBLIC_URL + '/github.png'} alt="github"/></Link>
            <Link to="#" className="social-icon"><img src={process.env.PUBLIC_URL + '/twitter.png'} alt="x"/></Link>
            <Link to="#" className="social-icon"><img src={process.env.PUBLIC_URL + '/linkedin.png'} alt="linkedin"/></Link>
          </div>
        </div>
        <div className="footer-right">
          <div className="footer-brand">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="6" cy="6" r="1" fill="#fff" />
              <circle cx="12" cy="4" r="1" fill="#fff" />
              <circle cx="18" cy="8" r="1" fill="#fff" />
              <rect x="5" y="18" width="8" height="2" rx="1" fill="#fff" />
            </svg>
            <span>LeData</span>
          </div>
          <div className="footer-copy">copyright....</div>
        </div>
      </div>
    </footer>
  );
}
