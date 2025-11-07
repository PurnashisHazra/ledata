import React, { useState, useEffect } from 'react';
import { useAuth } from './auth';
import './Profile.css';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export default function Profile(){
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    role_title: '',
    organization: '',
    github_url: '',
    linkedin_url: '',
    bio: '',
    image_url: '',
    public_profile: false,
    email: ''
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editable, setEditable] = useState({
    full_name: false,
    role_title: false,
    organization: false,
    email: false,
    github_url: false,
    linkedin_url: false,
    bio: false,
    image_url: false
  });
  const [publicSaving, setPublicSaving] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [slugMessage, setSlugMessage] = useState('');

  useEffect(() => {
    if(user){
    setForm({
      // backend/user model uses `username`; avoid relying on a non-existent `full_name`
        full_name: user.username || '',
        role_title: user.role_title || '',
        organization: user.organization || '',
        github_url: user.github_url || '',
        linkedin_url: user.linkedin_url || '',
        bio: user.bio || '',
        image_url: user.image_url || '',
        public_profile: !!user.public_profile,
        email: user.email || ''
      });
      setSlugValue(user.public_profile_slug || '');
    }
  }, [user]);

  if(!user){
    return (
      <div>
        <Header />
        <div style={{padding:24}}>You are not logged in. <button onClick={() => navigate('/login')}>Log in</button></div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try{
      const token = localStorage.getItem('ledata_token');
  // send edited name as username and include email from form
  const payload = { ...form, username: (form.full_name && form.full_name.trim()) ? form.full_name.trim() : user.username };
  payload.email = form.email || user.email;
      const res = await fetch(`${API_URL}/api/auth/profile`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if(res.ok){
        await refreshUser();
        navigate('/profile');
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.detail || 'Failed to save profile');
      }
    }catch(e){
      alert('Network error');
    }finally{
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try{
      const token = localStorage.getItem('ledata_token');
      const res = await fetch(`${API_URL}/api/auth/reset-password`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok){
        alert('Password reset initiated (simulated).');
      } else {
        alert('Failed to initiate password reset');
      }
    }catch(e){ alert('Network error'); }
  };

  const handleDelete = async () => {
    if(!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) return;
    try{
      const token = localStorage.getItem('ledata_token');
      const res = await fetch(`${API_URL}/api/auth/delete`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok){
        // clear client state and redirect to signup
        await logout();
        navigate('/signup');
      } else {
        alert('Failed to delete account');
      }
    }catch(e){ alert('Network error'); }
  };

  // Toggle public profile immediately when Yes/No clicked
  async function handleTogglePublic(makePublic){
    setPublicSaving(true);
    try{
      const token = localStorage.getItem('ledata_token');
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ public_profile: makePublic }) });
      if(res.ok){
        const data = await res.json().catch(() => null);
        // refresh user state
        await refreshUser();
        // update local form flag
        setForm(f => ({ ...f, public_profile: !!makePublic }));
        if(data && data.public_profile_slug){
          // show link immediately (refreshUser will also surface slug)
        }
      } else {
        const payload = await res.json().catch(() => ({}));
        alert(payload.detail || 'Failed to change public profile');
      }
    }catch(e){
      alert('Network error');
    }finally{
      setPublicSaving(false);
    }
  }

  return (
    <div className="profile-root">
      {/* Use the tab buttons as the heading - remove the static title */}
      <div role="tablist" aria-label="Profile sections" style={{display:'flex', justifyContent:'center', gap:24, marginBottom:16}}>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security</button>
      </div>
      {activeTab === 'profile' && (
      <div className="profile-grid">
        <div className="profile-input edit-wrap">
          <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Name" disabled={!editable.full_name} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, full_name: !e.full_name}))}>✎</button>
        </div>
        <div className="profile-input edit-wrap">
          <input name="role_title" value={form.role_title} onChange={handleChange} placeholder="Role/Title" disabled={!editable.role_title} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, role_title: !e.role_title}))}>✎</button>
        </div>
        <div className="profile-input edit-wrap">
          <input name="email" value={form.email || user.email} onChange={handleChange} placeholder="Work Email" disabled={!editable.email} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, email: !e.email}))}>✎</button>
        </div>
        <div className="profile-input edit-wrap">
          <input name="github_url" value={form.github_url} onChange={handleChange} placeholder="Github url" disabled={!editable.github_url} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, github_url: !e.github_url}))}>✎</button>
        </div>
        <div className="profile-input edit-wrap">
          <input name="organization" value={form.organization} onChange={handleChange} placeholder="Organization/Company/Uni" disabled={!editable.organization} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, organization: !e.organization}))}>✎</button>
        </div>
        <div className="profile-input edit-wrap">
          <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="Linkedin url" disabled={!editable.linkedin_url} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, linkedin_url: !e.linkedin_url}))}>✎</button>
        </div>
        <div className="profile-input large edit-wrap">
          <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Bio" disabled={!editable.bio} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, bio: !e.bio}))}>✎</button>
        </div>
        <div className="profile-input large edit-wrap">
          <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="Image" disabled={!editable.image_url} />
          <button type="button" className="edit-icon" onClick={() => setEditable(e => ({...e, image_url: !e.image_url}))}>✎</button>
        </div>
  </div>
      )}
      {activeTab === 'profile' && (
        <>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginTop:18}}>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <div>Make Profile Public</div>
              <label style={{display:'flex', gap:8, alignItems:'center'}}>
                <button type="button" className={`small-toggle ${form.public_profile ? 'active' : ''}`} onClick={() => handleTogglePublic(true)} disabled={publicSaving}>{publicSaving && form.public_profile ? '...' : 'Yes'}</button>
                <button type="button" className={`small-toggle ${!form.public_profile ? 'active' : ''}`} onClick={() => handleTogglePublic(false)} disabled={publicSaving}>{publicSaving && !form.public_profile ? '...' : 'No'}</button>
              </label>
            </div>
            <div>
                <a className="public-link" href={`/u/${user.public_profile_slug || ''}`} target="_blank" rel="noopener noreferrer">Public Profile Link</a>
              </div>
              <div style={{marginTop:12, textAlign:'center', width: '100%'}}>
                <div style={{display:'flex', justifyContent:'center', gap:8, alignItems:'center'}}>
                  <div style={{color:'#ddd', padding:8, border:'1px dashed rgba(255,255,255,0.12)'}}>ledata.co/u/</div>
                  <input className="slug-input" value={slugValue} onChange={(e) => setSlugValue(e.target.value)} placeholder="your-slug" />
                  <button className="slug-save" onClick={async () => {
                    // validate and save
                    const s = (slugValue || '').trim();
                    if(!s){ setSlugMessage('Slug cannot be empty'); return; }
                    // simple slug pattern
                    if(!/^[a-z0-9_-]{3,32}$/.test(s)){
                      setSlugMessage('Use 3-32 chars: a-z 0-9 - _');
                      return;
                    }
                    setSlugSaving(true); setSlugMessage('Checking...');
                    try{
                      // Check availability: call backend endpoint
                      const checkRes = await fetch(`${API_URL}/api/auth/check-slug/${encodeURIComponent(s)}`);
                      if(checkRes.status === 200){
                        const data = await checkRes.json().catch(() => ({}));
                        if(data.available){
                          // save via profile PUT
                          const token = localStorage.getItem('ledata_token');
                          const saveRes = await fetch(`${API_URL}/api/auth/profile`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ public_profile_slug: s }) });
                          if(saveRes.ok){
                            setSlugMessage('Saved');
                            await refreshUser();
                          } else {
                            const p = await saveRes.json().catch(() => ({}));
                            setSlugMessage(p.detail || 'Failed to save');
                          }
                        } else {
                          setSlugMessage('Not available');
                        }
                      } else if(checkRes.status === 404){
                        // endpoint not available on backend; attempt save and rely on server to reject duplicates
                        const token = localStorage.getItem('ledata_token');
                        const saveRes = await fetch(`${API_URL}/api/auth/profile`, { method: 'PUT', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ public_profile_slug: s }) });
                        if(saveRes.ok){ setSlugMessage('Saved'); await refreshUser(); }
                        else { const p = await saveRes.json().catch(() => ({})); setSlugMessage(p.detail || 'Failed to save'); }
                      } else {
                        setSlugMessage('Error checking slug');
                      }
                    }catch(e){ setSlugMessage('Network error'); }
                    setSlugSaving(false);
                    setTimeout(() => setSlugMessage(''), 3000);
                  }} disabled={slugSaving}>{slugSaving ? '...' : 'Save'}</button>
                </div>
                {slugMessage && <div style={{marginTop:8,color:'#f0f0f0',opacity:0.9}}>{slugMessage}</div>}
            </div>
            <div style={{marginTop:18}}>
              <button className="save-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </>
      )}
      {activeTab === 'security' && (
        <div className="security-root">
          <div className="security-btn" onClick={handleResetPassword}>Reset password</div>
          <div className="security-btn danger" onClick={handleDelete}>Delete profile</div>
        </div>
      )}
    </div>
  );
}
