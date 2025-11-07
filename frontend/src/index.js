import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Search from './Search';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dynamically load grecaptcha enterprise script only when enabled via env
try{
  const enabled = process.env.REACT_APP_RECAPTCHA_ENABLED || '1';
  if(enabled && !['0','false','no'].includes(String(enabled).toLowerCase())){
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/enterprise.js?render=6Ld6UewrAAAAAKAMsr7P4ByFkkKM3rzaRQCKcx73';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}catch(err){ /* ignore in non-browser environments */ }

// Development helper: log unhandled promise rejections and errors to console for easier debugging
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled promise rejection:', ev.reason);
});
window.addEventListener('error', (ev) => {
  console.error('Global error caught:', ev.error || ev.message);
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
