import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './Header';
import Footer from './Footer';
import Search from './Search';
import AddDataset from './AddDataset';
import EditDataset from './EditDataset';
import ViewDataset from './ViewDataset';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';
import PublicProfile from './PublicProfile';
import { Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
// Helper route guard
function RequireAuth({ children }){
  const { user } = useAuth();
  if(!user) return <Navigate to="/login" replace />;
  return children;
}
function App() {
  return (
    <AuthProvider>
    <Router>
  <Routes>
        <Route
          path="/"
          element={
            <div className="landing-root">
              <Header />
              <section className="quotes-section">
                <blockquote>“Even the largest data collection efforts still end up with a fraction of size and diversity of benchmark datasets in vision and NLP” - Google DeepMind (OXE)</blockquote>
                <blockquote>“Data diversity is more important than Data size” - RT1 Google</blockquote>
                <blockquote>“Data is a huge problem in robotics” - NVIDIA</blockquote>
                <blockquote>“There is no treasure trove of robotic data” - Physical Intelligence</blockquote>
                {/* convert the quote button into a CTA linking to search, styled like main search CTA */}
                <div className="quote-cta-wrapper">
                  <Link to="/search"><button className="not-anymore-btn">“not anymore” - LeData</button></Link>
                </div>
              </section>
              <section className="discover-section">
                <h1>Discover, Curate and Research</h1>
                <h2>with the largest & diverse collection of robotics data</h2>
                <ul>
                  <li>Find every open source datasets in one place</li>
                  <li>Filter and combine diverse datasets</li>
                  <li>Ask any question about the dataset or the publication (launching soon)</li>
                </ul>
              </section>
              <section className="stats-section">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="stat-block">
                    <div className="stat-title">1 Million</div>
                    <div className="stat-desc">Trajectories</div>
                  </div>
                ))}
              </section>
              <section className="search-section">
                <div className="filter-bar">
                  {["Robot Type","Robot Model","Domain","Environment","Tasks","Camera","Method","Annotation","Scene Complexity","Proprioception"].map((filter) => (
                    <button key={filter} className="filter-btn">{filter}</button>
                  ))}
                  <Link to="/search"><button className="search-btn">SEARCH</button></Link>
                </div>
              </section>
              <section className="datasets-section">
                <div className="dataset-cards">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="dataset-card">
                      <div className="dataset-title">OpenEGO <span className="dataset-year">2023</span></div>
                      <div className="dataset-desc">Description.........</div>
                      <div className="dataset-tags">
                        <button className="tag-btn">Domain</button>
                        <button className="tag-btn">Robot</button>
                        <button className="tag-btn">Tasks..</button>
                      </div>
                      <div className="dataset-icons">
                        <span role="img" aria-label="github">🌐</span>
                        <span role="img" aria-label="web">🌍</span>
                      </div>
                      <div className="dataset-source">Standford.,</div>
                    </div>
                  ))}
                </div>
                {/* translucent overlay placed on top of cards (centered overlay with single CTA) */}
                <div className="datasets-overlay">
                  <div className="overlay-buttons">
                    <Link to="/search"><button className="goto-datasets-btn overlay-btn primary">Go to Datasets</button></Link>
                  </div>
                </div>
              </section>
              <footer>
                {/* footer left minimal now that buttons moved into overlay */}
              </footer>
              {/* Vision section and extended footer (added below homepage content) */}
              <section className="vision-section">
                <div className="vision-inner">
                  <div className="vision-left">
                    <h1>Our Vision: Driving Robotics Forward</h1>
                    <p className="vision-body">We are building the data infrastructure for robotics, one dataset at a time. We are building the data infrastructure for robotics, one dataset at a time. We are building the data infrastructure for robotics, one dataset at a time. We are building the data infrastructure for robotics, one dataset at a time.</p>
                  </div>
                  <div className="vision-right">
                    <p className="vision-cta-desc">Need support in annotating or curating large datasets? Explore our Data-as-a-Service models.</p>
                    <button className="vision-cta">Get in touch</button>
                  </div>
                </div>
              </section>
              {/* footer is rendered globally via <Footer /> */}
            </div>
          }
        />
  <Route path="/search" element={<RequireAuth><Search /></RequireAuth>} />
  <Route path="/add-dataset" element={<RequireAuth><AddDataset /></RequireAuth>} />
  <Route path="/edit-dataset/:id" element={<RequireAuth><EditDataset /></RequireAuth>} />
  <Route path="/dataset/:id" element={<ViewDataset />} />
  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
  <Route path="/u/:slug" element={<PublicProfile />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/login" element={<Login />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {/* Global footer shown on all pages */}
      <Footer />
    </Router>
    </AuthProvider>
  );
}

export default App;

function AuthStatus(){
  const { user, logout } = useAuth();
  if(user){
    return (
      <>
        <span style={{marginRight:12}}>{user.username}</span>
        <button className="signup-btn" onClick={() => { logout(); window.location = '/'; }}>Logout</button>
      </>
    );
  }
  return (
    <>
      <Link to="/login" className="login-btn">Log in</Link>
      <Link to="/signup" className="signup-btn">Sign up for free</Link>
    </>
  );
}
