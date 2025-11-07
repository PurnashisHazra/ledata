import React, { useState } from 'react';
import './AddDataset.css';
import Header from './Header';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from './auth';

const initialState = {
  dataset_name: '',
  access_type: '',
  category: '',
  year_released_dataset: '',
  collected_by: '',
  description: '',
  dataset_license: '',
  file_size_gb: '',
  episodes: '',
  trajectories: '',
  timesteps: '',
  hours: '',
  demos: '',
  robots_used: '',
  gripper_type: '',
  action_space: '',
  dof: '',
  robot_type: '',
  robot_models: '',
  robot_morphology: '',
  data_collection_method: '',
  control_frequency: '',
  human_in_the_loop: '',
  suboptimal_data_included: '',
  annotation_method: '',
  rgb_cameras: '',
  depth_cameras: '',
  wrist_cameras: '',
  lidar: '',
  imu: '',
  audio_sensors: '',
  force_torque: '',
  proprioception: '',
  camera_calibration: '',
  language_in_the_loop: '',
  language_annotation: '',
  multimodal_data: '',
  domain: '',
  skills: '',
  tasks: '',
  task_count: '',
  task_types: '',
  success_failure_labels: '',
  environment_type: '',
  environments: '',
  objects_variety: '',
  scene_type: '',
  scene_complexity: '',
  lighting_variability: '',
  paper_title: '',
  paper_year: '',
  authors: '',
  affiliations: '',
  abstract: '',
  models_evaluated: '',
  venue: '',
  publication_type: '',
  doi: '',
  arxiv_link: '',
  pdf_link: '',
  project_page: '',
  code_link: '',
  video_link: ''
};

export default function AddDataset() {
  const [form, setForm] = React.useState(initialState);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.dataset_name.trim()) {
      setError('Dataset name is required');
      return;
    }
    setError('');
    setLoading(true);
    try{
      const headers = { 'Content-Type': 'application/json' };
      try{
        const token = localStorage.getItem('ledata_token');
        if(token) headers['Authorization'] = `Bearer ${token}`;
      }catch(e){}

      // Build cleaned payload: remove empty strings, convert numeric-like fields to numbers,
      // and map frontend 'dof' -> backend 'degrees_of_freedom_dof'.
      const numericKeys = new Set([
        'file_size_gb','episodes','trajectories','timesteps','hours','demos','robots_used',
        'dof','paper_year','rgb_cameras','depth_cameras','wrist_cameras','control_frequency','task_count','environments','objects_variety'
      ]);
      const cleaned = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        const s = typeof v === 'string' ? v.trim() : v;
        if (s === '') return; // skip empty values so backend uses model defaults
        const key = k === 'dof' ? 'degrees_of_freedom_dof' : k;
        if (numericKeys.has(k)) {
          // try to parse number
          const num = Number(s);
          if (!Number.isNaN(num)) {
            cleaned[key] = num;
            return;
          }
          // if not a number, store as string
          cleaned[key] = s;
          return;
        }
        cleaned[key] = s;
      });

      const res = await fetch(`${API_URL}/api/datasets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(cleaned)
      });
      if (res.ok) {
        setForm(initialState);
        navigate('/search');
      } else if (res.status === 401) {
        setError('You must be logged in to add a dataset');
        navigate('/login');
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.detail || 'Failed to add dataset');
      }
    }catch(err){
      setError('Network error');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="add-dataset-modal">
      <div className="add-dataset-box add-dataset-border">
        <div className="add-dataset-nav">
          <div className="add-dataset-navbar">
            <RouterLink to="/"><span className="add-dataset-logo">{'{Le}Data'}</span></RouterLink>
            {user && (
              <div style={{position:'relative'}}>
                <button className="hi-user-btn" onClick={() => setShowUserMenu(s => !s)}>Hi {user.username}</button>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <button className="user-dropdown-item" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
                  </div>
                )}
              </div>
            )}
            <span className="add-dataset-icons">
              <span role="img" aria-label="github">🌐</span>
              <span role="img" aria-label="x">❌</span>
              <span role="img" aria-label="linkedin">in</span>
            </span>
            <span className="add-dataset-navlinks">Dashboard Data services Profile</span>
            <button className="add-dataset-addbtn">Add</button>
            <span className="add-dataset-profileicon">↪️</span>
          </div>
          <div className="add-dataset-tabs">
            Discover | Saved | Submitted | My Projects
          </div>
        </div>
        <div className="add-dataset-header">
          Add a dataset <span className="add-dataset-header-desc">(click each field to edit directly)</span>
          <span className="add-dataset-close">X</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-dataset-section add-dataset-border">
            <div className="add-dataset-label">Dataset name</div>
            <input className="add-dataset-input" name="dataset_name" value={form.dataset_name} onChange={handleChange} required />
            <div className="add-dataset-row">
              <input className="add-dataset-input" name="access_type" value={form.access_type} onChange={handleChange} placeholder="Access Type" />
              <input className="add-dataset-input" name="category" value={form.category} onChange={handleChange} placeholder="Category" />
              <input className="add-dataset-input" name="year_released_dataset" value={form.year_released_dataset} onChange={handleChange} placeholder="Year" />
            </div>
            <div className="add-dataset-icons-row">
              <span className="add-dataset-icon">⚙️</span>
              <span className="add-dataset-icon">🌐</span>
              <span className="add-dataset-icon">🤖</span>
              <span className="add-dataset-icon">🧑‍🔬</span>
            </div>
            <div className="add-dataset-row">
              <input className="add-dataset-input" name="collected_by" value={form.collected_by} onChange={handleChange} placeholder="{add institutions separated by comma}" />
            </div>
            <textarea className="add-dataset-input" name="description" value={form.description} onChange={handleChange} placeholder="Description of the dataset" />
            <input className="add-dataset-input" name="dataset_license" value={form.dataset_license} onChange={handleChange} placeholder="License" />
          </div>
          <div className="add-dataset-grid-2x2">
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Quick metrics</div>
              <div className="quick-metrics-grid">
                <div className="quick-metrics-label">File Size (GB):</div>
                <input className="add-dataset-input quick-metrics-input" name="file_size_gb" value={form.file_size_gb} onChange={handleChange} />
                <div className="quick-metrics-label">#Episodes:</div>
                <input className="add-dataset-input quick-metrics-input" name="episodes" value={form.episodes} onChange={handleChange} />
                <div className="quick-metrics-label">#Trajectories:</div>
                <input className="add-dataset-input quick-metrics-input" name="trajectories" value={form.trajectories} onChange={handleChange} />
                <div className="quick-metrics-label">#Timesteps:</div>
                <input className="add-dataset-input quick-metrics-input" name="timesteps" value={form.timesteps} onChange={handleChange} />
                <div className="quick-metrics-label">#Hours:</div>
                <input className="add-dataset-input quick-metrics-input" name="hours" value={form.hours} onChange={handleChange} />
                <div className="quick-metrics-label">#Demos:</div>
                <input className="add-dataset-input quick-metrics-input" name="demos" value={form.demos} onChange={handleChange} />
                <div className="quick-metrics-label">#Robots Used:</div>
                <input className="add-dataset-input quick-metrics-input" name="robots_used" value={form.robots_used} onChange={handleChange} />
                <div className="quick-metrics-label">Gripper type:</div>
                <input className="add-dataset-input quick-metrics-input" name="gripper_type" value={form.gripper_type} onChange={handleChange} />
                <div className="quick-metrics-label">Action space:</div>
                <input className="add-dataset-input quick-metrics-input" name="action_space" value={form.action_space} onChange={handleChange} />
                <div className="quick-metrics-label">DoF:</div>
                <input className="add-dataset-input quick-metrics-input" name="dof" value={form.dof} onChange={handleChange} />
              </div>
            </div>
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Robot</div>
              <div className="add-dataset-row-label">
                <div>Robot Type:</div>
                <input className="add-dataset-input" name="robot_type" value={form.robot_type} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Robot Models:</div>
                <input className="add-dataset-input" name="robot_models" value={form.robot_models} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Robot Morphology:</div>
                <input className="add-dataset-input" name="robot_morphology" value={form.robot_morphology} onChange={handleChange} />
              </div>
              <div className="add-dataset-title" style={{marginTop:'24px'}}>Data Collection</div>
              <div className="add-dataset-row-label">
                <div>Data Collection Method:</div>
                <input className="add-dataset-input" name="data_collection_method" value={form.data_collection_method} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Control Frequency:</div>
                <input className="add-dataset-input" name="control_frequency" value={form.control_frequency} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Human-in-the-loop?</div>
                <input className="add-dataset-input" name="human_in_the_loop" value={form.human_in_the_loop} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Suboptimal Data Included?</div>
                <input className="add-dataset-input" name="suboptimal_data_included" value={form.suboptimal_data_included} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Annotation Method:</div>
                <input className="add-dataset-input" name="annotation_method" value={form.annotation_method} onChange={handleChange} />
              </div>
            </div>
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Equipment</div>
              <div className="add-dataset-row-label">
                <div>#RGB Cameras:</div>
                <input className="add-dataset-input" name="rgb_cameras" value={form.rgb_cameras} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>#Depth Cameras:</div>
                <input className="add-dataset-input" name="depth_cameras" value={form.depth_cameras} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>#Wrist Cameras:</div>
                <input className="add-dataset-input" name="wrist_cameras" value={form.wrist_cameras} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>LiDAR:</div>
                <input className="add-dataset-input" name="lidar" value={form.lidar} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>IMU:</div>
                <input className="add-dataset-input" name="imu" value={form.imu} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Audio Sensors:</div>
                <input className="add-dataset-input" name="audio_sensors" value={form.audio_sensors} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Force/Torque:</div>
                <input className="add-dataset-input" name="force_torque" value={form.force_torque} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Proprioception:</div>
                <input className="add-dataset-input" name="proprioception" value={form.proprioception} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Camera Calibration:</div>
                <input className="add-dataset-input" name="camera_calibration" value={form.camera_calibration} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Language Instructions:</div>
                <input className="add-dataset-input" name="language_in_the_loop" value={form.language_in_the_loop} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Language annotation:</div>
                <input className="add-dataset-input" name="language_annotation" value={form.language_annotation} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Multinodal Data:</div>
                <input className="add-dataset-input" name="multimodal_data" value={form.multimodal_data} onChange={handleChange} />
              </div>
            </div>
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Tasks and Environment</div>
              <div className="add-dataset-row-label">
                <div>Domain:</div>
                <input className="add-dataset-input" name="domain" value={form.domain} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Skills:</div>
                <input className="add-dataset-input" name="skills" value={form.skills} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Tasks:</div>
                <input className="add-dataset-input" name="tasks" value={form.tasks} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Task count:</div>
                <input className="add-dataset-input" name="task_count" value={form.task_count} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Task Types:</div>
                <input className="add-dataset-input" name="task_types" value={form.task_types} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Success/Failure Labels:</div>
                <input className="add-dataset-input" name="success_failure_labels" value={form.success_failure_labels} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Environment Type:</div>
                <input className="add-dataset-input" name="environment_type" value={form.environment_type} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>#Environments:</div>
                <input className="add-dataset-input" name="environments" value={form.environments} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Objects Variety:</div>
                <input className="add-dataset-input" name="objects_variety" value={form.objects_variety} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Scene Type:</div>
                <input className="add-dataset-input" name="scene_type" value={form.scene_type} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Scene Complexity:</div>
                <input className="add-dataset-input" name="scene_complexity" value={form.scene_complexity} onChange={handleChange} />
              </div>
              <div className="add-dataset-row-label">
                <div>Lighting Variability:</div>
                <input className="add-dataset-input" name="lighting_variability" value={form.lighting_variability} onChange={handleChange} />
              </div>
            </div>
          </div>
          <div className="add-dataset-section add-dataset-border">
            <div className="add-dataset-title">Publication</div>
            <div>Title <input className="add-dataset-input" name="paper_title" value={form.paper_title} onChange={handleChange} /></div>
            <div>Paper Year: <input className="add-dataset-input" name="paper_year" value={form.paper_year} onChange={handleChange} /></div>
            <div>Authors: <input className="add-dataset-input" name="authors" value={form.authors} onChange={handleChange} /></div>
            <div>Affiliations: <input className="add-dataset-input" name="affiliations" value={form.affiliations} onChange={handleChange} /></div>
            <div>Abstract <textarea className="add-dataset-input" name="abstract" value={form.abstract} onChange={handleChange} /></div>
            <div>Models evaluated: <input className="add-dataset-input" name="models_evaluated" value={form.models_evaluated} onChange={handleChange} /></div>
            <div>Venue: <input className="add-dataset-input" name="venue" value={form.venue} onChange={handleChange} /></div>
            <div>Publication Type: <input className="add-dataset-input" name="publication_type" value={form.publication_type} onChange={handleChange} /></div>
            <div>DOI: <input className="add-dataset-input" name="doi" value={form.doi} onChange={handleChange} /></div>
            <div>ArXiv Link: <input className="add-dataset-input" name="arxiv_link" value={form.arxiv_link} onChange={handleChange} /></div>
            <div>PDF Link: <input className="add-dataset-input" name="pdf_link" value={form.pdf_link} onChange={handleChange} /></div>
            <div>Project Page: <input className="add-dataset-input" name="project_page" value={form.project_page} onChange={handleChange} /></div>
            <div>Code Link: <input className="add-dataset-input" name="code_link" value={form.code_link} onChange={handleChange} /></div>
            <div>Video Link: <input className="add-dataset-input" name="video_link" value={form.video_link} onChange={handleChange} /></div>
          </div>
          {error && <div className="add-dataset-error">{error}</div>}
          <button className="add-dataset-btn" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add dataset'}</button>
        </form>
      </div>
    </div>
    </div>
  );
}
