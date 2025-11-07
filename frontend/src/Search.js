import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './auth';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import SearchForm, { options } from './SearchForm';
import './Search.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// removed default placeholder dataset cards — show nothing when datasets/projects are empty

const toggleKeys = [
  'lidar','imu','audioSensors','humanInLoop','suboptimalData','cameraCalibration','languageInstructions','forceTorque','proprioception'
];

export default function Search() {
  const { user } = useAuth();
  const [toggles, setToggles] = useState(
    Object.fromEntries(toggleKeys.map(key => [key, false]))
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [simpleParams, setSimpleParams] = useState({});
  const [advancedParams, setAdvancedParams] = useState({});
  const [activeTab, setActiveTab] = useState('Discover');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [projects, setProjects] = useState([]);
  const [creatingProject, setCreatingProject] = useState(false);
  // previous save flow replaced by add-to-project flow
  const [projectAddTarget, setProjectAddTarget] = useState(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [addingToProject, setAddingToProject] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [messages, setMessages] = useState([]);
  const [compose, setCompose] = useState('');
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if(user){
      // Load projects from backend so dataset names are resolved (user.projects may only contain ids)
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [user]);

  // helper to fetch projects
  const fetchProjects = async () => {
    setProjectsError('');
    setProjectsLoading(true);
    try{
      const token = localStorage.getItem('ledata_token');
      const res = await fetch(`${API_URL}/api/projects`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      if(res.ok){
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        const payload = await res.json().catch(() => ({}));
        setProjectsError(payload.detail || 'Failed to load projects');
      }
    }catch(e){
      setProjectsError('Network error while fetching projects');
    }finally{
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if(activeTab === 'My Projects'){
      fetchProjects();
    }
  }, [activeTab]);

  useEffect(() => {
    // scroll to bottom when messages change
    if(chatBodyRef.current){
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const text = (compose || '').trim();
    if(!text) return;
    const msg = { from: 'user', text, time: new Date().toLocaleTimeString() };
    setMessages(ms => [...ms, msg]);
    setCompose('');
    // simulate assistant reply
    setTimeout(() => {
      const reply = { from: 'assistant', text: `I received: "${text}" — (This is a simulated assistant for the pixel mockup).`, time: new Date().toLocaleTimeString() };
      setMessages(ms => [...ms, reply]);
    }, 700 + Math.random() * 800);
  };

  // Robust helper to extract an id string from a dataset object returned by the API
  const extractDatasetId = (dataset) => {
    if (!dataset) return null;
    // common shapes: { id: '...' } or { _id: '...' } or { _id: { $oid: '...' } }
    if (dataset.id) return dataset.id;
    if (dataset._id && typeof dataset._id === 'string') return dataset._id;
    if (dataset._id && typeof dataset._id === 'object') {
      if (dataset._id.$oid) return dataset._id.$oid;
      // some serializers use {'$oid': '...'}
      const keys = Object.keys(dataset._id);
      if (keys.length === 1 && dataset._id[keys[0]]) return dataset._id[keys[0]];
    }
    // fallback: try common alternate fields
    if (dataset._id_str) return dataset._id_str;
    return null;
  };

  // Ensure we always set datasets as an array to avoid slice errors
  const setDatasetsSafe = (value) => {
    if (!value) {
      setDatasets([]);
      return;
    }
    if (Array.isArray(value)) {
      setDatasets(value);
      return;
    }
    // if backend returns an object with `datasets` or `projects` accidentally, try to extract
    if (value.datasets && Array.isArray(value.datasets)) {
      setDatasets(value.datasets);
      return;
    }
    // fallback: wrap single item in array if it's an object
    if (typeof value === 'object') {
      setDatasets([value]);
      return;
    }
    // otherwise clear
    setDatasets([]);
  };

  const handleSave = async (dataset) => {
    const dsid = extractDatasetId(dataset);
    if (!dsid) { alert('Unable to determine dataset id'); return; }
    try{
      const token = localStorage.getItem('ledata_token');
      const res = await fetch(`${API_URL}/api/datasets/${dsid}/save`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        // Optionally switch to Saved tab and load saved datasets
        if (activeTab === 'Saved') {
          const r2 = await fetch(`${API_URL}/api/datasets/saved`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          if (r2.ok) { const dlist = await r2.json(); setDatasetsSafe(dlist); setCurrentPage(1); }
        }
        alert('Saved to Saved datasets');
      } else {
        const p = await res.json().catch(()=>null);
        alert(p?.detail || 'Failed to save dataset');
      }
    }catch(e){ console.error('Network error saving dataset', e); alert('Network error'); }
  };

  // save flow handled via adding to a project now

  useEffect(() => {
    // Fetch all datasets on mount (use API_URL and include auth token if available)
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('ledata_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/api/datasets`, { headers });
        if (res.ok) {
          const data = await res.json();
          setDatasetsSafe(data);
          setCurrentPage(1);
        } else {
          setDatasetsSafe([]);
        }
      } catch (e) {
        setDatasetsSafe([]);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    // Fetch datasets based on active tab, include auth token when available so /saved returns the user's saved datasets
    const fetchDatasetsForTab = async () => {
  let url = `${API_URL}/api/datasets`;
  if (activeTab === 'Saved') url = `${API_URL}/api/datasets/saved`;
  // 'Submitted' should return datasets created/submitted by the user
  if (activeTab === 'Submitted') url = `${API_URL}/api/datasets/submitted`;
  // 'My Projects' is handled by fetchProjects() and should not fetch datasets here
      try {
        const token = localStorage.getItem('ledata_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setDatasetsSafe(data);
          setCurrentPage(1);
        } else {
          setDatasetsSafe([]);
        }
      } catch (e) {
        setDatasetsSafe([]);
      }
    };
    fetchDatasetsForTab();
  }, [activeTab]);

  const handleSimpleChange = (e) => {
    const { name, value } = e.target;
    setSimpleParams(p => ({ ...p, [name]: value }));
  };

  const handleAdvancedChange = (e) => {
    const { name, value } = e.target;
    setAdvancedParams(p => ({ ...p, [name]: value }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setToggles(t => ({ ...t, [name]: checked }));
  };

  const handleAdvancedToggle = () => {
    setShowAdvanced(v => !v);
  };

  const handleSearch = async () => {
    // Build params: always include simple params; include advanced only if panel open
    let params = { ...simpleParams };
    if (showAdvanced) {
      params = { ...params, ...advancedParams };
      params = { ...params, ...toggles };
    }

    // Clean params: remove empty strings and convert numeric-ish fields to numbers
    const numericFields = new Set([
      'year_released_dataset','episodes','trajectories','hours','file_size_gb','dof',
      'rgb_cameras','wrist_cameras','depth_cameras','control_frequency','objects_variety','task_count'
    ]);
    const cleaned = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (typeof v === 'string') {
        const s = v.trim();
        if (s === '') return;
        if (numericFields.has(k) && !Number.isNaN(Number(s))) {
          cleaned[k] = Number(s);
          return;
        }
        cleaned[k] = s;
        return;
      }
      // booleans and numbers pass through
      if (typeof v === 'number' && !Number.isNaN(v)) {
        cleaned[k] = v;
        return;
      }
      if (typeof v === 'boolean') {
        cleaned[k] = v;
        return;
      }
    });

    // include auth token if present in localStorage
    let headers = { 'Content-Type': 'application/json' };
    try{
      const token = localStorage.getItem('ledata_token');
      if(token) headers['Authorization'] = `Bearer ${token}`;
    }catch(e){}

    const res = await fetch(`${API_URL}/api/datasets/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cleaned)
    });
    const data = await res.json();
    setDatasetsSafe(data);
    setCurrentPage(1);
  };

  return (
    <div className="search-root">
      <Header />
      <div className={`search-main ${activeTab === 'My Projects' ? 'projects-mode' : ''}`}>
        {activeTab !== 'My Projects' && (
          <>
            <aside className="search-sidebar">
              <div className="search-section">
                <div className="search-title">Simple search</div>
                <div className="simple-search-group">
                  <input className="search-filter-input" type="text" name="dataset_name" placeholder="Dataset Name" onChange={handleSimpleChange} />
                  <select className="search-filter-input" name="category" onChange={handleSimpleChange}>
                    <option value="">Category</option>
                    {options.category.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input className="search-filter-input" type="number" name="year_released_dataset" placeholder="Year" onChange={handleSimpleChange} />
                  <select className="search-filter-input" name="robot_type" onChange={handleSimpleChange}>
                    <option value="">Robot Type</option>
                    {options.robotType.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input className="search-filter-input" type="text" name="robot_models" placeholder="Robot model" onChange={handleSimpleChange} />
                  <select className="search-filter-input" name="data_collection_method" onChange={handleSimpleChange}>
                    <option value="">Method </option>
                    {options.dataCollectionMethod.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select className="search-filter-input" name="domain" onChange={handleSimpleChange}>
                    <option value="">Domain</option>
                    {options.domain.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select className="search-filter-input" name="skills" onChange={handleSimpleChange}>
                    <option value="">Skills</option>
                    {options.skills.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select className="search-filter-input" name="environment_type" onChange={handleSimpleChange}>
                    <option value="">Environment</option>
                    {options.environmentType.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <input className="search-filter-input" type="number" name="objects_variety" placeholder="#Variety" onChange={handleSimpleChange} />
                </div>
              </div>
          <div className="search-section">
            <div
              className="search-title search-advanced-toggle"
              style={{cursor:'pointer', display:'flex', alignItems:'center'}}
              onClick={handleAdvancedToggle}
            >
              Advanced search
              <span style={{marginLeft:8, fontSize:'1.2em', transition:'transform 0.2s', transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                ▼
              </span>
            </div>
            {showAdvanced && (
              <div className="advanced-search-group">
                <select className="search-filter-input" name="dataset_license" onChange={handleAdvancedChange}>
                  <option value="">License</option>
                  {options.datasetLicense.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input className="search-filter-input" type="number" name="episodes" placeholder="Episodes" onChange={handleAdvancedChange} />
                <input className="search-filter-input" type="number" name="trajectories" placeholder="Trajectories" onChange={handleAdvancedChange} />
                <input className="search-filter-input" type="number" name="hours" placeholder="Hours" onChange={handleAdvancedChange} />
                <select className="search-filter-input" name="robot_morphology" onChange={handleAdvancedChange}>
                  <option value="">Morphology</option>
                  {options.robotMorphology.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="gripper_type" onChange={handleAdvancedChange}>
                  <option value="">Gripper</option>
                  {options.gripperType.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="action_space" onChange={handleAdvancedChange}>
                  <option value="">Action space</option>
                  {options.actionSpace.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="tasks" onChange={handleAdvancedChange}>
                  <option value="">Tasks</option>
                  {options.tasks.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="scene_complexity" onChange={handleAdvancedChange}>
                  <option value="">Scene Complexity</option>
                  {options.sceneComplexity.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="scene_type" onChange={handleAdvancedChange}>
                  <option value="">Scene Type</option>
                  {options.sceneType.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input className="search-filter-input" type="number" name="dof" placeholder="DoF" onChange={handleAdvancedChange} />
                <input className="search-filter-input" type="number" name="rgb_cameras" placeholder="RGB Cam" onChange={handleAdvancedChange} />
                <input className="search-filter-input" type="number" name="wrist_cameras" placeholder="Wrist cam" onChange={handleAdvancedChange} />
                <input className="search-filter-input" type="number" name="depth_cameras" placeholder="Depth Cam" onChange={handleAdvancedChange} />
                <select className="search-filter-input" name="language_annotation" onChange={handleAdvancedChange}>
                  <option value="">Language annotation</option>
                  {options.languageAnnotation.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="annotation_method" onChange={handleAdvancedChange}>
                  <option value="">Annotation method</option>
                  {options.annotationMethod.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select className="search-filter-input" name="multimodal_data" onChange={handleAdvancedChange}>
                  <option value="">Multimodal data</option>
                  {options.multimodalData.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input className="search-filter-input" type="number" name="control_frequency" placeholder="Control frequency" onChange={handleAdvancedChange} />
                <div className="search-toggles">
                  {toggleKeys.map(key => (
                    <div className="toggle-row" key={key}>
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('SuboptimalData', 'Suboptimal data').replace('ForceTorque', 'Force/Torque sensor').replace('LanguageInstructions', 'Language instr.')}</span>
                      <label style={{position:'relative', display:'inline-block'}}>
                        <input
                          type="checkbox"
                          className="toggle-switch"
                          name={key}
                          checked={toggles[key]}
                          onChange={handleToggle}
                        />
                        <span className="switch-label" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* SEARCH button sits outside the dropdown so it's always visible */}
            <div className="search-main-cta">
              <button className="search-filter-btn search-main-btn" onClick={handleSearch}>SEARCH</button>
            </div>
          </div>
  </aside>
    </>
  )}
  <main className="search-content">
          <div className="search-tabs">
            <span
              className={activeTab === 'Discover' ? 'active' : ''}
              onClick={() => setActiveTab('Discover')}
              style={{cursor:'pointer'}}
            >Discover</span> |
            <span
              className={activeTab === 'Saved' ? 'active' : ''}
              onClick={() => setActiveTab('Saved')}
              style={{cursor:'pointer'}}
            >Saved</span> |
            <span
              className={activeTab === 'Submitted' ? 'active' : ''}
              onClick={() => setActiveTab('Submitted')}
              style={{cursor:'pointer'}}
            >Submitted</span> |
            <span
              className={activeTab === 'My Projects' ? 'active' : ''}
              onClick={() => setActiveTab('My Projects')}
              style={{cursor:'pointer'}}
            >My Projects</span>
          </div>
          {activeTab === 'My Projects' ? (
            <div className="projects-root">
              <div className="breadcrumb">Create Project → Add dataset → Research with our AI</div>
              <div style={{margin: '12px 0'}}>
                <button className="create-project-btn" onClick={() => setShowCreateModal(true)}>Create Project</button>
              </div>
              {projectsLoading && <div className="projects-loading"><div className="spinner"/></div>}
              {projectsError && <div className="projects-error">{projectsError} <button className="small-btn" onClick={fetchProjects}>Retry</button></div>}
              <div className="projects-heading">My Projects</div>
              {/* Two-column: left stacked project cards, right ChatGPT-like chat panel */}
              <div className="projects-columns">
                <div className="projects-left-col">
                  <div className="projects-list-header">Projects</div>
                  <div className="project-stack">
                    {projectsLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div className="project-stack-card skeleton" key={i}>
                          <div className="skeleton-line skeleton-title" />
                          <div className="skeleton-line skeleton-desc" />
                          <div style={{display:'flex', gap:8, marginTop:12}}>
                            <div className="tag-skeleton" />
                            <div className="tag-skeleton" />
                          </div>
                        </div>
                      ))
                    ) : (
                      (projects && projects.length > 0 ? projects : []).map((proj, i) => (
                        <div
                          className={`project-stack-card ${selectedProject && selectedProject.id === proj.id ? 'selected' : ''}`}
                          key={proj.id || i}
                          onClick={() => setSelectedProject(proj)}
                        >
                          <div className="project-stack-title">{proj.name || 'Project Name'}</div>
                          <div className="project-stack-desc">{proj.description || 'Description'}</div>
                          <div className="project-dataset-list">
                            {(proj.datasets && proj.datasets.length > 0 ? proj.datasets.slice(0, (expandedProjects[proj.id] ? 20 : 2)).map((d, j) => (
                              <div key={j} className="project-dataset-item">{d.dataset_name || `Data ${j+1}`}</div>
                            )) : (
                              <>
                                <div className="project-dataset-item">Data 1</div>
                                <div className="project-dataset-item">Data 2</div>
                              </>
                            ))}
                            {proj.datasets && proj.datasets.length > 2 && (
                              <button
                                className="project-view-more"
                                onClick={(e) => { e.stopPropagation(); setExpandedProjects(prev => ({ ...prev, [proj.id]: !prev[proj.id] })); }}
                              >
                                {expandedProjects[proj.id] ? 'Show less' : `View ${proj.datasets.length - 2} more`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="projects-chat-col">
                  <div className="projects-chat">
                    <div className="chat-header">
                      <div className="chat-project-title">{selectedProject ? selectedProject.name : 'Select a project'}</div>
                      <div className="chat-header-actions">
                        <button className="small-btn" onClick={() => { setActiveTab('Discover'); }}>Add dataset</button>
                      </div>
                    </div>
                    <div className="chat-body" ref={chatBodyRef}>
                      {messages.length === 0 && (
                        <div className="chat-empty">{selectedProject ? 'Start a conversation about this project.' : 'Select a project from the left to begin.'}</div>
                      )}
                      {messages.map((m, i) => (
                        <div key={i} className={`chat-msg ${m.from === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}`}>
                          <div className="chat-msg-content">{m.text}</div>
                          <div className="chat-msg-time">{m.time}</div>
                        </div>
                      ))}
                    </div>
                    <div className="chat-input-row">
                      <div className="prompt-box">
                        <div className="prompt-left-icons">
                          <button className="icon-btn" title="Templates">🗂️</button>
                          <button className="icon-btn" title="Browse web">🌐</button>
                          <button className="icon-btn" title="Attach">📎</button>
                        </div>
                        <textarea
                          className="prompt-textarea"
                          placeholder={`Write your prompt here..`}
                          value={compose}
                          onChange={e => setCompose(e.target.value)}
                          onKeyDown={async (e) => {
                            if(e.key === 'Enter' && !e.shiftKey){
                              e.preventDefault();
                              await handleSendMessage();
                            }
                          }}
                        />
                      </div>
                      <button className="fab-mic" title="Voice input" onClick={() => { /* voice capture placeholder */ }}>
                        <div className="fab-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {showCreateModal && (
                <div className="modal-overlay">
                  <div className="modal">
                    <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
                    <h2>Create Project</h2>
                    <input className="modal-input" placeholder="Project Name" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                    <textarea className="modal-input" placeholder="Description/Notes" value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} />
                    <div style={{marginTop:12}}>
                      <button className="create-project-btn" onClick={async () => {
                        if(!newProjectName || newProjectName.trim()===''){ alert('Please enter a project name'); return; }
                        setCreatingProject(true);
                        try{
                          const token = localStorage.getItem('ledata_token');
                          const res = await fetch(`${API_URL}/api/projects`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDesc || '' }) });
                          if(res.ok){
                            const data = await res.json();
                            const p = data.project || { name: newProjectName.trim(), description: newProjectDesc || '', dataset_ids: [] };
                            setProjects(ps => [p, ...ps]);
                            setShowCreateModal(false);
                            setNewProjectName('');
                            setNewProjectDesc('');
                          } else {
                            const payload = await res.json().catch(()=>({}));
                            alert(payload.detail || 'Failed to create project');
                          }
                        }catch(e){
                          alert('Network error');
                        }finally{
                          setCreatingProject(false);
                        }
                      }}>{creatingProject ? 'Creating...' : 'Create Project'}</button>
                    </div>
                    <div style={{marginTop:12, color:'#bbb'}}>After creating a project, please proceed with adding datasets from Discover section</div>
                  </div>
                </div>
              )}
              {/* removed page-next inside My Projects (no pagination for projects) */}
            </div>
          ) : (
            <div className="search-dataset-list">
              {datasets
                .slice((currentPage - 1) * 5, currentPage * 5)
                .map((dataset, idx) => (
                  <div key={idx + (currentPage-1)*5} className="search-dataset-card">
                    <div className="search-dataset-header">
                      <div className="search-dataset-title-wrap">
                        <span className="search-dataset-title" style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => {
                          const dsid = extractDatasetId(dataset);
                          if(!dsid){ alert('Unable to open dataset'); return; }
                          navigate(`/dataset/${dsid}`);
                        }}>{dataset.dataset_name}</span>
                        <div className="access-year">
                          <span className="access-box">{dataset.access_type || 'Access Type'}</span>
                          <span className="year-box">{dataset.year_released_dataset || 'Year'}</span>
                        </div>
                      </div>
                      <div className="search-dataset-actions">
                        <button className="icon-circle" title="Save" aria-label="Save" onClick={() => { handleSave(dataset); }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M7 3v6a2 2 0 0 0 2 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button className="icon-circle" title="Favorite" aria-label="Favorite">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21s-6.716-4.35-9.243-7.02C-0.33 10.962 3.12 5 7.5 7.5 9.21 8.683 11 11 12 12c1-1 2.79-3.317 4.5-4.5C20.88 5 24.33 10.962 21.243 13.98 18.716 16.65 12 21 12 21z" stroke="currentColor" strokeWidth="0.8" fill="none" />
                          </svg>
                        </button>
                        
                        <button className="icon-circle" title="Add to Project" aria-label="Add to Project" onClick={() => {
                          // open project selection dropdown for this dataset
                          setProjectAddTarget(dataset);
                          setShowProjectDropdown(true);
                          // ensure we have the latest projects
                          fetchProjects();
                        }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="search-dataset-meta-row">
                      {activeTab === 'Saved' ? (
                        <span style={{cursor:'pointer', color:'#f66'}} onClick={async () => {
                          if(!window.confirm('Remove this dataset from your Saved list?')) return;
                          const dsid = extractDatasetId(dataset);
                          if(!dsid){ alert('Unable to determine dataset id'); return; }
                          try{
                            const token = localStorage.getItem('ledata_token');
                            const res = await fetch(`${API_URL}/api/datasets/${dsid}/unsave`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
                            if(res.ok){
                              // remove from local list
                              setDatasets(ds => (Array.isArray(ds) ? ds.filter(d => extractDatasetId(d) !== dsid) : []));
                            } else {
                              const p = await res.json().catch(()=>null);
                              alert(p?.detail || 'Failed to remove from Saved');
                            }
                          }catch(e){ console.error('Error unsaving dataset', e); alert('Network error'); }
                        }}>Delete</span>
                      ) : (
                        // For non-saved tabs (Submitted etc.) allow deleting or correcting
                        <span>
                          <span style={{cursor:'pointer', color:'#f66'}} onClick={async () => {
                            if(!window.confirm('Delete this dataset? This will remove it permanently.')) return;
                            const dsid = extractDatasetId(dataset);
                            if(!dsid){ alert('Unable to determine dataset id'); return; }
                            try{
                              const token = localStorage.getItem('ledata_token');
                              const res = await fetch(`${API_URL}/api/datasets/${dsid}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
                              if(res.ok){
                                // remove from local list
                                setDatasets(ds => (Array.isArray(ds) ? ds.filter(d => extractDatasetId(d) !== dsid) : []));
                              } else {
                                const p = await res.json().catch(()=>null);
                                alert(p?.detail || 'Failed to delete dataset');
                              }
                            }catch(e){ console.error('Error deleting dataset', e); alert('Network error'); }
                          }}>Delete</span>
                          {' '}|{' '}
                          <span style={{cursor:'pointer', textDecoration:'underline'}} onClick={() => {
                            const dsid = extractDatasetId(dataset);
                            if(!dsid){ alert('Unable to determine dataset id'); return; }
                            navigate(`/edit-dataset/${dsid}`);
                          }}>Correct</span>
                        </span>
                      )}
                    </div>
                    <div className="search-dataset-info">
                      <div>Robot Type: {dataset.robot_type}</div>
                      <div>Environment type: {dataset.environment_type}</div>
                      <div>Robot Model: {dataset.robot_models}</div>
                      <div>Collected by: {dataset.collected_by}</div>
                      <div>Domain: {dataset.domain}</div>
                    </div>
                    <div className="search-dataset-skills">
                      {(dataset.skills || '').split(',').map((s, i) => s && s.trim() ? (
                        <button key={i} className="skill-btn">{s.trim()}</button>
                      ) : null)}
                    </div>
                    <div className="search-dataset-desc">
                      {dataset.description}
                    </div>
                    <div className="search-dataset-icons">
                      <span role="img" aria-label="github">🌐</span>
                      <span role="img" aria-label="web">🌍</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {showProjectDropdown && projectAddTarget && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Select project</h3>
                <p>Choose a project to add <strong>{projectAddTarget.dataset_name}</strong> to:</p>
                <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:220, overflow:'auto', marginTop:8}}>
                  {projects && projects.length > 0 ? projects.map((p, i) => (
                    <button key={i} className="small-btn" onClick={() => { setSelectedProjectId(p.id); setShowProjectDropdown(false); setShowAddConfirm(true); }}>{p.name}</button>
                  )) : (
                    <div style={{color:'#bbb'}}>No projects yet. Create one first.</div>
                  )}
                </div>
                <div style={{marginTop:12}}>
                  <button className="small-btn" onClick={() => { setShowProjectDropdown(false); setProjectAddTarget(null); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {showAddConfirm && selectedProjectId && projectAddTarget && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Add dataset to project?</h3>
                <p>Are you sure you want to add <strong>{projectAddTarget.dataset_name}</strong> to the project <strong>{(projects.find(p => p.id === selectedProjectId) || {}).name}</strong>?</p>
                <div style={{display:'flex', gap:12, marginTop:12}}>
                  <button className="create-project-btn" onClick={async () => {
                    setAddingToProject(true);
                    try{
                      const dsid = extractDatasetId(projectAddTarget);
                      if(!dsid){ alert('Unable to determine dataset id'); setAddingToProject(false); return; }
                      const token = localStorage.getItem('ledata_token');
                      const res = await fetch(`${API_URL}/api/projects/${selectedProjectId}/add-dataset`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ dataset_id: dsid }) });
                      if(res.ok){
                        const payload = await res.json().catch(()=>null);
                        console.log('Add to project response payload', payload);
                        if(payload && payload.projects){
                          setProjects(payload.projects);
                        } else {
                          // fallback to explicit fetch
                          await fetchProjects();
                        }
                        setShowAddConfirm(false);
                        setProjectAddTarget(null);
                        setSelectedProjectId(null);
                      } else {
                        const payload = await res.json().catch(()=>null);
                        alert(payload?.detail || 'Failed to add dataset to project');
                      }
                    }catch(e){ console.error('Error adding to project', e); alert('Network error'); }
                    finally{ setAddingToProject(false); }
                  }} disabled={addingToProject}>{addingToProject ? 'Adding...' : 'Yes, add'}</button>
                  <button className="small-btn" onClick={() => { setShowAddConfirm(false); setSelectedProjectId(null); setProjectAddTarget(null); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {activeTab !== 'My Projects' && (
            <div className="pagination-row">
              <button
                className="search-next-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >Previous</button>
              {/* page number removed per request */}
              <button
                className="search-next-btn"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(datasets.length/5), p + 1))}
                disabled={currentPage === Math.ceil(datasets.length/5) || datasets.length === 0}
              >Next</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
