import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import './Profile.css';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function PublicProfile(){
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try{
        const res = await fetch(`${API_URL}/api/users/public/${encodeURIComponent(slug)}`);
        if(res.ok){
          const data = await res.json();
          if(mounted) setProfile(data);
        }
      }catch(err){ console.error('Failed to load public profile', err); }
      if(mounted) setLoading(false);
    })();
    return () => { mounted = false };
  }, [slug]);

  if(loading) return (<div><Header /><div style={{padding:24}}>Loading...</div></div>);
  if(!profile) return (<div><Header /><div style={{padding:24}}>Public profile not found.</div></div>);

  return (
    <div>
      <Header />
      <div className="profile-root">
        <div style={{display:'flex', gap:24, alignItems:'center'}}>
          <div style={{width:120,height:120,border:'1px solid #fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {profile.image_url ? <img src={profile.image_url} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <div style={{padding:12}}>Image</div>}
          </div>
          <div>
            <h1 style={{margin:0}}>{profile.username}</h1>
            <div style={{marginTop:6}}>
              <strong style={{display:'inline-block', marginRight:8}}>Organization:</strong>
              <span>{profile.organization || '—'}</span>
            </div>
            <div style={{marginTop:6}}>
              <strong style={{display:'inline-block', marginRight:8}}>Bio</strong>
              <div style={{marginTop:6, maxWidth:760}}>{profile.bio || 'No bio provided.'}</div>
            </div>
          </div>
        </div>
        <div style={{marginTop:24}}>
          {profile.datasets && profile.datasets.length > 0 ? profile.datasets.map(ds => (
            <div key={ds.id} className="dataset-card" style={{marginBottom:12}}>
              <div className="dataset-title" style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => { window.location.href = `/dataset/${ds.id}`; }}>{ds.dataset_name}</div>
              <div className="dataset-desc">{ds.description}</div>
            </div>
          )) : <div>No public datasets.</div>}
        </div>
      </div>
    </div>
  );
}
