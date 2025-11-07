import React from 'react';
import './AddDataset.css';
import Header from './Header';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
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

export default function EditDataset(){
  const [form, setForm] = React.useState(initialState);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const refs = React.useRef({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if(!id) return;
      try{
        const token = localStorage.getItem('ledata_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/api/datasets/${id}`, { headers });
        if(res.ok){
          const data = await res.json();
          // map backend keys to our form keys (degrees_of_freedom_dof -> dof)
          const mapped = { ...initialState };
          Object.entries(data).forEach(([k,v]) => {
            if(k === 'degrees_of_freedom_dof') mapped['dof'] = v;
            else if(k in mapped) mapped[k] = v;
          });
          if(mounted) setForm(mapped);
        } else {
          if(res.status === 404) navigate('/search');
        }
      }catch(e){ console.error('Failed to fetch dataset', e); }
    })();
    return () => { mounted = false };
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const focusField = (name) => {
    const el = refs.current[name];
    if(el && el.focus) el.focus();
  };

  const renderInput = (name, props = {}) => (
    <div className="edit-wrap">
      <input className="add-dataset-input" name={name} value={form[name] || ''} onChange={handleChange} ref={el => refs.current[name] = el} {...props} />
      <button type="button" className="edit-icon" onClick={() => focusField(name)}>✎</button>
    </div>
  );

  const renderTextarea = (name, props = {}) => (
    <div className="edit-wrap">
      <textarea className="add-dataset-input" name={name} value={form[name] || ''} onChange={handleChange} ref={el => refs.current[name] = el} {...props} />
      <button type="button" className="edit-icon" onClick={() => focusField(name)}>✎</button>
    </div>
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.dataset_name || !form.dataset_name.trim()) {
      setError('Dataset name is required');
      return;
    }
    setError('');
    setLoading(true);
    try{
      const headers = { 'Content-Type': 'application/json' };
      try{ const token = localStorage.getItem('ledata_token'); if(token) headers['Authorization'] = `Bearer ${token}`; }catch(e){}

      const numericKeys = new Set([
        'file_size_gb','episodes','trajectories','timesteps','hours','demos','robots_used',
        'dof','paper_year','rgb_cameras','depth_cameras','wrist_cameras','control_frequency','task_count','environments','objects_variety'
      ]);
      const cleaned = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        const s = typeof v === 'string' ? v.trim() : v;
        if (s === '') return;
        const key = k === 'dof' ? 'degrees_of_freedom_dof' : k;
        if (numericKeys.has(k)) {
          const num = Number(s);
          if (!Number.isNaN(num)) { cleaned[key] = num; return; }
          cleaned[key] = s; return;
        }
        cleaned[key] = s;
      });

      const res = await fetch(`${API_URL}/api/datasets/${id}`, {
        method: 'PUT', headers, body: JSON.stringify(cleaned)
      });
      if (res.ok) {
        navigate('/search');
      } else if (res.status === 401) {
        setError('You must be logged in to edit a dataset');
        navigate('/login');
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.detail || 'Failed to update dataset');
      }
    }catch(err){ setError('Network error'); }
    finally{ setLoading(false); }
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
                <button className="hi-user-btn">Hi {user.username}</button>
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
          <div className="add-dataset-tabs">Discover | Saved | Submitted | My Projects</div>
        </div>
        <div className="add-dataset-header">
          Edit dataset <span className="add-dataset-header-desc">(click each field to edit directly)</span>
          <span className="add-dataset-close">X</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-dataset-section add-dataset-border">
            <div className="add-dataset-label">Dataset name</div>
            {renderInput('dataset_name')}
            <div className="add-dataset-row">
              <div style={{flex:1}}>{renderInput('access_type', {placeholder:'Access Type'})}</div>
              <div style={{flex:1}}>{renderInput('category', {placeholder:'Category'})}</div>
              <div style={{flex:1}}>{renderInput('year_released_dataset', {placeholder:'Year'})}</div>
            </div>
            <div className="add-dataset-icons-row">
              <span className="add-dataset-icon">⚙️</span>
              <span className="add-dataset-icon">🌐</span>
              <span className="add-dataset-icon">🤖</span>
              <span className="add-dataset-icon">🧑‍🔬</span>
            </div>
            <div className="add-dataset-row">
              <div style={{flex:1}}>{renderInput('collected_by', {placeholder:'{add institutions separated by comma}'})}</div>
            </div>
            {renderTextarea('description', {placeholder:'Description of the dataset'})}
            {renderInput('dataset_license', {})}
          </div>

          <div className="add-dataset-grid-2x2">
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Quick metrics</div>
              <div className="quick-metrics-grid">
                <div className="quick-metrics-label">File Size (GB):</div>
                {renderInput('file_size_gb', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">#Episodes:</div>
                {renderInput('episodes', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">#Trajectories:</div>
                {renderInput('trajectories', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">#Timesteps:</div>
                {renderInput('timesteps', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">#Hours:</div>
                {renderInput('hours', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">#Demos:</div>
                {renderInput('demos', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">#Robots Used:</div>
                {renderInput('robots_used', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">Gripper type:</div>
                {renderInput('gripper_type', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">Action space:</div>
                {renderInput('action_space', {className:'add-dataset-input quick-metrics-input'})}
                <div className="quick-metrics-label">DoF:</div>
                {renderInput('dof', {className:'add-dataset-input quick-metrics-input'})}
              </div>
            </div>
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Robot</div>
              <div className="add-dataset-row-label">
                <div>Robot Type:</div>
                {renderInput('robot_type')}
              </div>
              <div className="add-dataset-row-label">
                <div>Robot Models:</div>
                {renderInput('robot_models')}
              </div>
              <div className="add-dataset-row-label">
                <div>Robot Morphology:</div>
                {renderInput('robot_morphology')}
              </div>
              <div className="add-dataset-title" style={{marginTop:'24px'}}>Data Collection</div>
              <div className="add-dataset-row-label">
                <div>Data Collection Method:</div>
                {renderInput('data_collection_method')}
              </div>
              <div className="add-dataset-row-label">
                <div>Control Frequency:</div>
                {renderInput('control_frequency')}
              </div>
              <div className="add-dataset-row-label">
                <div>Human-in-the-loop?</div>
                {renderInput('human_in_the_loop')}
              </div>
              <div className="add-dataset-row-label">
                <div>Suboptimal Data Included?</div>
                {renderInput('suboptimal_data_included')}
              </div>
              <div className="add-dataset-row-label">
                <div>Annotation Method:</div>
                {renderInput('annotation_method')}
              </div>
            </div>
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Equipment</div>
              <div className="add-dataset-row-label">
                <div>#RGB Cameras:</div>
                {renderInput('rgb_cameras')}
              </div>
              <div className="add-dataset-row-label">
                <div>#Depth Cameras:</div>
                {renderInput('depth_cameras')}
              </div>
              <div className="add-dataset-row-label">
                <div>#Wrist Cameras:</div>
                {renderInput('wrist_cameras')}
              </div>
              <div className="add-dataset-row-label">
                <div>LiDAR:</div>
                {renderInput('lidar')}
              </div>
              <div className="add-dataset-row-label">
                <div>IMU:</div>
                {renderInput('imu')}
              </div>
              <div className="add-dataset-row-label">
                <div>Audio Sensors:</div>
                {renderInput('audio_sensors')}
              </div>
              <div className="add-dataset-row-label">
                <div>Force/Torque:</div>
                {renderInput('force_torque')}
              </div>
              <div className="add-dataset-row-label">
                <div>Proprioception:</div>
                {renderInput('proprioception')}
              </div>
              <div className="add-dataset-row-label">
                <div>Camera Calibration:</div>
                {renderInput('camera_calibration')}
              </div>
              <div className="add-dataset-row-label">
                <div>Language Instructions:</div>
                {renderInput('language_in_the_loop')}
              </div>
              <div className="add-dataset-row-label">
                <div>Language annotation:</div>
                {renderInput('language_annotation')}
              </div>
              <div className="add-dataset-row-label">
                <div>Multinodal Data:</div>
                {renderInput('multimodal_data')}
              </div>
            </div>
            <div className="add-dataset-boxcell add-dataset-border">
              <div className="add-dataset-title">Tasks and Environment</div>
              <div className="add-dataset-row-label">
                <div>Domain:</div>
                {renderInput('domain')}
              </div>
              <div className="add-dataset-row-label">
                <div>Skills:</div>
                {renderInput('skills')}
              </div>
              <div className="add-dataset-row-label">
                <div>Tasks:</div>
                {renderInput('tasks')}
              </div>
              <div className="add-dataset-row-label">
                <div>Task count:</div>
                {renderInput('task_count')}
              </div>
              <div className="add-dataset-row-label">
                <div>Task Types:</div>
                {renderInput('task_types')}
              </div>
              <div className="add-dataset-row-label">
                <div>Success/Failure Labels:</div>
                {renderInput('success_failure_labels')}
              </div>
              <div className="add-dataset-row-label">
                <div>Environment Type:</div>
                {renderInput('environment_type')}
              </div>
              <div className="add-dataset-row-label">
                <div>#Environments:</div>
                {renderInput('environments')}
              </div>
              <div className="add-dataset-row-label">
                <div>Objects Variety:</div>
                {renderInput('objects_variety')}
              </div>
              <div className="add-dataset-row-label">
                <div>Scene Type:</div>
                {renderInput('scene_type')}
              </div>
              <div className="add-dataset-row-label">
                <div>Scene Complexity:</div>
                {renderInput('scene_complexity')}
              </div>
              <div className="add-dataset-row-label">
                <div>Lighting Variability:</div>
                {renderInput('lighting_variability')}
              </div>
            </div>
          </div>

          <div className="add-dataset-section add-dataset-border">
            <div className="add-dataset-title">Publication</div>
            <div>Title {renderInput('paper_title')}</div>
            <div>Paper Year: {renderInput('paper_year')}</div>
            <div>Authors: {renderInput('authors')}</div>
            <div>Affiliations: {renderInput('affiliations')}</div>
            <div>Abstract {renderTextarea('abstract')}</div>
            <div>Models evaluated: {renderInput('models_evaluated')}</div>
            <div>Venue: {renderInput('venue')}</div>
            <div>Publication Type: {renderInput('publication_type')}</div>
            <div>DOI: {renderInput('doi')}</div>
            <div>ArXiv Link: {renderInput('arxiv_link')}</div>
            <div>PDF Link: {renderInput('pdf_link')}</div>
            <div>Project Page: {renderInput('project_page')}</div>
            <div>Code Link: {renderInput('code_link')}</div>
            <div>Video Link: {renderInput('video_link')}</div>
          </div>
          {error && <div className="add-dataset-error">{error}</div>}
          <button className="add-dataset-btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </div>
    </div>
  );
}
